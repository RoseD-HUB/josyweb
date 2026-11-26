import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  getAvailableFittingSlots,
  validateFittingBookingRequest,
} from './server/lib/fittingBooking.ts';
import { buildOfficialOrderReceiptText } from './server/lib/receiptBuilder.ts';
import type { ReceiptLineItemInput } from './server/lib/receiptBuilder.ts';
import { recommendRtwOrLuxuryFit } from './server/lib/sizeAdvisor.ts';
import {
  addAtelierWorkingDays,
  CURRENCY_RATES,
  generateCarrierTrackingCode,
  generateOrderReference,
  getAtelierSchedule,
  resolveShippingZone,
  SHIPPING_ZONES_LIST,
  SHIPPING_ZONES_MAP,
  STUDIO_INFO,
  validateTailoringMeasurements,
} from './server/lib/studioData.ts';
import {
  buildOrdersCsvReport,
  buildTailorJobCardCutSheet,
  buildWorkshopAnalyticsSummary,
} from './server/lib/workshopAnalytics.ts';
import type {
  AdminInventoryInput,
  AdminOrderSummaryInput,
  JobCardGarmentInput,
} from './server/lib/workshopAnalytics.ts';
import {
  getActiveSeedWhitelistEntries,
  hashWhitelistPassword,
  isEmailActiveInServerWhitelist,
  isValidWhitelistEmail,
  issueWhitelistSessionToken,
  normalizeWhitelistEmail,
  setServerWhitelistStatus,
  upsertServerWhitelistEntry,
  verifyRegisteredWhitelistCredentials,
  verifyWhitelistPassword,
  verifyWhitelistSessionToken,
} from './server/lib/whitelistCrypto.ts';
import {
  buildContentSecurityPolicy,
  getStrictAllowedOrigins,
} from './server/lib/securityHeaders.ts';
import { createRateLimiter } from './server/middleware/rateLimit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const PAYMENT_MODE: 'pending' | 'live' =
  process.env.PAYMENT_MODE?.trim().toLowerCase() === 'live' ? 'live' : 'pending';
const BOOTSTRAPPED_ADMIN_EMAIL = STUDIO_INFO.adminEmail;
const STUDIO_CONTACT_EMAIL = STUDIO_INFO.email;

// Read Firebase projectId from firebase-applet-config.json (no IAM needed for verifyIdToken)
function loadFirebaseProjectId(): string | undefined {
  try {
    const cfgPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { projectId?: string };
      if (parsed.projectId && parsed.projectId !== 'remixed-project-id') {
        return parsed.projectId;
      }
    }
  } catch (err) {
    console.warn('Unable to read firebase-applet-config.json:', err);
  }
  return process.env.FIREBASE_PROJECT_ID || undefined;
}

const projectId = loadFirebaseProjectId();
const firebaseAdminApp = projectId
  ? getApps().length
    ? getApp()
    : initializeApp({ projectId })
  : null;

interface AuthenticatedRequest extends Request {
  authUser?: DecodedIdToken;
}

const ALLOWED_CURRENCIES = new Set(Object.keys(CURRENCY_RATES));
const ALLOWED_GATEWAYS = new Set(['paystack', 'flutterwave', 'stripe', 'pending']);
const SAFE_REF_REGEX = /^[a-zA-Z0-9_-]{4,128}$/;

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function cleanText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function getAllowedOrigins(): Set<string> {
  return getStrictAllowedOrigins(IS_PROD);
}

function resolveCallbackBaseUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, '');
  if (configured && (configured.startsWith('https://') || configured.startsWith('http://'))) {
    return configured;
  }
  const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : req.protocol;
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function isVerifiedStudioAdmin(user?: DecodedIdToken): boolean {
  return Boolean(
    user &&
      user.email_verified === true &&
      user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );
}

async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!firebaseAdminApp) {
    res.status(503).json({ error: 'Authentication service is not configured.' });
    return;
  }
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Bearer authentication token.' });
    return;
  }
  const idToken = header.slice('Bearer '.length).trim();
  if (!idToken || idToken.length > 4096) {
    res.status(401).json({ error: 'Invalid authentication token format.' });
    return;
  }
  try {
    const decoded = await getAuth(firebaseAdminApp).verifyIdToken(idToken);
    req.authUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication token is invalid or expired.' });
  }
}

function normalizeGatewayKey(
  raw: string
): 'paystack' | 'flutterwave' | 'stripe' | 'pending' | null {
  const lower = raw.toLowerCase();
  if (lower.includes('pending')) return 'pending';
  if (lower.includes('paystack')) return 'paystack';
  if (lower.includes('flutterwave')) return 'flutterwave';
  if (lower.includes('stripe')) return 'stripe';
  return null;
}

function requireVerifiedStudioAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!isVerifiedStudioAdmin(req.authUser)) {
    res.status(403).json({ error: 'Verified Studio Administrator privileges required.' });
    return;
  }
  next();
}

async function createServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Enforce strict HTTP security headers on all routes (/*)
  app.use((req, res, next) => {
    const host = (req.get('host') || '').toLowerCase();
    const isAiStudioPreview = host.endsWith('.run.app');
    const isRenderOrProd = IS_PROD || Boolean(process.env.RENDER) || host.includes('onrender.com');
    const enforceStrictFrameDeny = isRenderOrProd && !isAiStudioPreview;

    const csp = buildContentSecurityPolicy({
      isDev: !IS_PROD,
      includeFrameAncestors: true,
      allowAiStudioPreview: !enforceStrictFrameDeny,
    });

    res.setHeader('Content-Security-Policy', csp);
    if (enforceStrictFrameDeny) {
      res.setHeader('X-Frame-Options', 'DENY');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    if (enforceStrictFrameDeny) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  const apiRateLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 120,
    keyPrefix: 'api',
  });
  const writeRateLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 25,
    keyPrefix: 'api-write',
  });
  const whitelistAuthRateLimiter = createRateLimiter({
    windowMs: 15 * 60_000,
    maxRequests: 20,
    keyPrefix: 'whitelist-auth',
  });

  app.use('/api', apiRateLimiter);

  // Strict origin CORS allowlist for /api (never wildcard on authenticated routes)
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      const allowed = getAllowedOrigins();
      const requestHost = req.get('host');
      const isSameOrigin =
        requestHost &&
        (origin === `https://${requestHost}` || origin === `http://${requestHost}`);
      if (isSameOrigin || allowed.has(origin.replace(/\/+$/, ''))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      }
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // =========================================================================
  // 1. Cryptographic Payment Webhooks (Raw body parsed BEFORE express.json)
  // =========================================================================

  // Paystack Webhook (HMAC-SHA512 + timingSafeEqual)
  app.post(
    '/api/webhooks/paystack',
    express.raw({ type: 'application/json', limit: '256kb' }),
    (req, res) => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        res.status(503).json({ error: 'Paystack webhook secret not configured.' });
        return;
      }
      const signature = String(req.headers['x-paystack-signature'] || '');
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
      const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

      if (!signature || !timingSafeCompare(signature, expected)) {
        res.status(401).json({ error: 'Invalid Paystack webhook signature.' });
        return;
      }

      try {
        const event = JSON.parse(rawBody.toString('utf8')) as {
          event?: string;
          data?: { reference?: string; status?: string };
        };
        console.info('Verified Paystack webhook:', event.event, event.data?.reference);
        res.status(200).json({ received: true });
      } catch {
        res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }
  );

  // Flutterwave Webhook (verif-hash + timingSafeEqual)
  app.post(
    '/api/webhooks/flutterwave',
    express.raw({ type: 'application/json', limit: '256kb' }),
    (req, res) => {
      const expectedHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
      if (!expectedHash) {
        res.status(503).json({ error: 'Flutterwave webhook hash not configured.' });
        return;
      }
      const receivedHash = String(req.headers['verif-hash'] || '');
      if (!receivedHash || !timingSafeCompare(receivedHash, expectedHash)) {
        res.status(401).json({ error: 'Invalid Flutterwave webhook signature.' });
        return;
      }

      try {
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
        const event = JSON.parse(rawBody.toString('utf8')) as {
          event?: string;
          data?: { tx_ref?: string; status?: string };
        };
        console.info('Verified Flutterwave webhook:', event.event, event.data?.tx_ref);
        res.status(200).json({ received: true });
      } catch {
        res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }
  );

  // Stripe Webhook (HMAC-SHA256 checking all v1 signatures + 5-min replay window)
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json', limit: '256kb' }),
    (req, res) => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!secret) {
        res.status(503).json({ error: 'Stripe webhook secret not configured.' });
        return;
      }
      const sigHeader = String(req.headers['stripe-signature'] || '');
      let timestamp = NaN;
      const v1Signatures: string[] = [];

      for (const pair of sigHeader.split(',')) {
        const idx = pair.indexOf('=');
        if (idx === -1) continue;
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        if (key === 't') timestamp = Number(val);
        if (key === 'v1' && val) v1Signatures.push(val);
      }

      const nowSec = Math.floor(Date.now() / 1000);
      if (
        !Number.isFinite(timestamp) ||
        Math.abs(nowSec - timestamp) > 300 ||
        v1Signatures.length === 0
      ) {
        res.status(401).json({ error: 'Invalid or expired Stripe signature header.' });
        return;
      }

      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      const matched = v1Signatures.some((sig) => timingSafeCompare(sig, expected));
      if (!matched) {
        res.status(401).json({ error: 'Invalid Stripe webhook signature.' });
        return;
      }

      try {
        const event = JSON.parse(rawBody) as { id?: string; type?: string };
        console.info('Verified Stripe webhook:', event.type, event.id);
        res.status(200).json({ received: true });
      } catch {
        res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }
  );

  // Standard JSON body parser for all other API routes
  app.use('/api', express.json({ limit: '100kb' }));

  // =========================================================================
  // 2. Health, Studio Metadata, Atelier Schedule & Pricing Quote Endpoints
  // =========================================================================
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'josy-textile-api',
      environment: IS_PROD ? 'production' : 'development',
      paymentMode: PAYMENT_MODE,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/studio/info', (_req, res) => {
    res.status(200).json({
      brand: STUDIO_INFO.brand,
      founder: STUDIO_INFO.founder,
      headquarters: STUDIO_INFO.headquarters,
      phone: STUDIO_INFO.phone,
      email: STUDIO_INFO.email,
      hours: STUDIO_INFO.hours,
      paymentMode: PAYMENT_MODE,
      currencies: CURRENCY_RATES,
      shippingZones: SHIPPING_ZONES_MAP,
      capabilities: {
        paymentMode: PAYMENT_MODE,
        paystackConfigured: PAYMENT_MODE === 'live' && Boolean(process.env.PAYSTACK_SECRET_KEY),
        flutterwaveConfigured:
          PAYMENT_MODE === 'live' && Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
        stripeConfigured: PAYMENT_MODE === 'live' && Boolean(process.env.STRIPE_SECRET_KEY),
        emailConfigured: Boolean(process.env.RESEND_API_KEY),
        whatsappConfigured: Boolean(
          process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
        ),
      },
    });
  });

  app.get('/api/studio/atelier-schedule', (_req, res) => {
    res.status(200).json(getAtelierSchedule());
  });

  app.get('/api/catalog/shipping-zones', (_req, res) => {
    res.status(200).json({
      currency: 'NGN',
      zones: SHIPPING_ZONES_LIST,
    });
  });

  app.post('/api/pricing/quote', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const rtwSubtotalNGN = Number(body.rtwSubtotalNGN || 0);
    const luxurySubtotalNGN = Number(
      body.luxurySubtotalNGN ?? body.bespokeSubtotalNGN ?? 0
    );
    const zoneId = cleanText(body.shippingZoneId, 40);
    const currency = cleanText(body.currency, 8).toUpperCase();
    const paymentPlan = cleanText(body.paymentPlan, 40);

    const zone = resolveShippingZone(zoneId);
    const curr = CURRENCY_RATES[currency];

    if (
      !Number.isFinite(rtwSubtotalNGN) ||
      !Number.isFinite(luxurySubtotalNGN) ||
      rtwSubtotalNGN < 0 ||
      luxurySubtotalNGN < 0 ||
      rtwSubtotalNGN + luxurySubtotalNGN > 500_000_000 ||
      !zone ||
      !curr
    ) {
      res.status(400).json({ error: 'Invalid pricing quote parameters.' });
      return;
    }

    const subtotalNGN = Math.round(rtwSubtotalNGN + luxurySubtotalNGN);
    const shippingNGN = zone.rateNGN;
    const totalNGN = subtotalNGN + shippingNGN;
    const useSplit = paymentPlan === 'SPLIT_DEPOSIT_60_40' && luxurySubtotalNGN > 0;
    const luxuryDueNowNGN = useSplit ? Math.round(luxurySubtotalNGN * 0.6) : luxurySubtotalNGN;
    const amountDueNowNGN = Math.round(rtwSubtotalNGN + luxuryDueNowNGN + shippingNGN);
    const balanceDueNGN = totalNGN - amountDueNowNGN;
    const targetCompletionDate = addAtelierWorkingDays(
      new Date(),
      luxurySubtotalNGN > 0 ? 10 : 2
    );

    res.status(200).json({
      currency,
      paymentMode: PAYMENT_MODE,
      shippingZone: zone,
      subtotalNGN,
      shippingNGN,
      totalNGN,
      amountDueNowNGN,
      balanceDueNGN,
      amountDueNowConverted: Math.round(amountDueNowNGN * curr.rateFromNGN * 100) / 100,
      totalConverted: Math.round(totalNGN * curr.rateFromNGN * 100) / 100,
      targetCompletionDate,
    });
  });

  // =========================================================================
  // 3. Authoritative Order Preparation, Tailoring Validation & Official Receipts
  // =========================================================================
  app.post(
    '/api/orders/prepare',
    writeRateLimiter,
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const shippingZoneId = cleanText(body.shippingZoneId, 40);
      const currency = cleanText(body.currency, 8).toUpperCase();
      const paymentPlan = cleanText(body.paymentPlan, 40);
      const splitDepositEnabled = body.splitDepositEnabled !== false;
      const itemsRaw = Array.isArray(body.items) ? body.items : [];

      const zone = resolveShippingZone(shippingZoneId);
      const curr = CURRENCY_RATES[currency];

      if (!zone || !curr || itemsRaw.length === 0 || itemsRaw.length > 50) {
        res.status(400).json({ error: 'Invalid order preparation payload.' });
        return;
      }

      let rtwSubtotalNGN = 0;
      let luxurySubtotalNGN = 0;
      let hasLuxuryItems = false;

      for (const rawItem of itemsRaw) {
        if (!rawItem || typeof rawItem !== 'object') {
          res.status(400).json({ error: 'Malformed cart item entry.' });
          return;
        }
        const entry = rawItem as Record<string, unknown>;
        const mode = cleanText(entry.selectedMode, 16);
        const unitPrice = Number(entry.unitPriceNGN);
        const quantity = Number(entry.quantity);

        if (
          (mode !== 'RTW' && mode !== 'BESPOKE') ||
          !Number.isFinite(unitPrice) ||
          unitPrice <= 0 ||
          unitPrice > 50_000_000 ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 50
        ) {
          res.status(400).json({ error: 'Invalid item pricing or quantity.' });
          return;
        }

        if (mode === 'BESPOKE') {
          hasLuxuryItems = true;
          luxurySubtotalNGN += unitPrice * quantity;
        } else {
          rtwSubtotalNGN += unitPrice * quantity;
        }
      }

      const subtotalNGN = Math.round(rtwSubtotalNGN + luxurySubtotalNGN);
      const shippingNGN = zone.rateNGN;
      const totalNGN = subtotalNGN + shippingNGN;
      const useSplit =
        paymentPlan === 'SPLIT_DEPOSIT_60_40' && hasLuxuryItems && splitDepositEnabled;

      let amountPaidNGN: number;
      let balanceDueNGN: number;
      let balanceSettled: boolean;
      let paymentStatus: 'PENDING_CONFIRMATION' | 'AUTHORIZED';

      if (PAYMENT_MODE === 'pending') {
        amountPaidNGN = 0;
        balanceDueNGN = totalNGN;
        balanceSettled = false;
        paymentStatus = 'PENDING_CONFIRMATION';
      } else {
        const luxuryDeposit = useSplit ? Math.round(luxurySubtotalNGN * 0.6) : luxurySubtotalNGN;
        amountPaidNGN = Math.round(rtwSubtotalNGN + luxuryDeposit + shippingNGN);
        balanceDueNGN = totalNGN - amountPaidNGN;
        balanceSettled = balanceDueNGN === 0;
        paymentStatus = 'AUTHORIZED';
      }

      const orderId = generateOrderReference();
      const targetCompletionDate = addAtelierWorkingDays(new Date(), hasLuxuryItems ? 10 : 2);

      res.status(200).json({
        orderId,
        paymentMode: PAYMENT_MODE,
        paymentStatus,
        paymentGatewayLabel:
          PAYMENT_MODE === 'pending'
            ? 'Payment Pending (Studio Confirmation)'
            : cleanText(body.paymentGateway, 80),
        paymentPlan: useSplit ? 'SPLIT_DEPOSIT_60_40' : 'FULL_UPFRONT',
        shippingZone: zone,
        subtotalNGN,
        shippingNGN,
        totalNGN,
        amountPaidNGN,
        balanceDueNGN,
        balanceSettled,
        targetCompletionDate,
        preparedForUid: req.authUser?.uid,
      });
    }
  );

  app.post(
    '/api/tailoring/validate-measurements',
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const unit = body.unit === 'cm' ? 'cm' : 'in';
      const measurements =
        body.measurements && typeof body.measurements === 'object'
          ? (body.measurements as Record<string, unknown>)
          : null;

      if (!measurements) {
        res.status(400).json({ error: 'Measurements object is required.' });
        return;
      }

      const result = validateTailoringMeasurements(measurements, unit);
      res.status(result.valid ? 200 : 422).json(result);
    }
  );

  app.post(
    '/api/orders/receipt',
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const orderId = cleanText(body.orderId, 40);
      const customerEmail = cleanText(body.customerEmail, 180);
      const currency = cleanText(body.currency, 8).toUpperCase();

      if (!SAFE_REF_REGEX.test(orderId) || !ALLOWED_CURRENCIES.has(currency)) {
        res.status(400).json({ error: 'Invalid order reference or currency.' });
        return;
      }

      const isAdminCaller = isVerifiedStudioAdmin(req.authUser);
      const isSelfEmail =
        Boolean(req.authUser?.email) &&
        customerEmail.toLowerCase() === req.authUser?.email?.toLowerCase();

      if (!isAdminCaller && !isSelfEmail) {
        res.status(403).json({ error: 'Not authorized to generate receipt for this order.' });
        return;
      }

      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length === 0 || rawItems.length > 50) {
        res.status(400).json({ error: 'Order must contain between 1 and 50 items.' });
        return;
      }

      const items: ReceiptLineItemInput[] = [];
      for (const raw of rawItems) {
        if (!raw || typeof raw !== 'object') {
          res.status(400).json({ error: 'Invalid item entry in receipt request.' });
          return;
        }
        const entry = raw as Record<string, unknown>;
        const mode = entry.mode === 'BESPOKE' ? 'BESPOKE' : 'RTW';
        const qty = Number(entry.quantity);
        const unitPrice = Number(entry.unitPriceNGN);
        if (!Number.isInteger(qty) || qty < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
          res.status(400).json({ error: 'Invalid item quantity or price.' });
          return;
        }
        items.push({
          name: cleanText(entry.name, 120) || 'Josy Textile Garment',
          sku: cleanText(entry.sku, 40),
          mode,
          quantity: qty,
          unitPriceNGN: unitPrice,
          size: cleanText(entry.size, 12) || undefined,
          swatchName: cleanText(entry.swatchName, 60) || undefined,
          cutOption: cleanText(entry.cutOption, 60) || undefined,
        });
      }

      const receiptText = buildOfficialOrderReceiptText({
        orderId,
        createdAt: cleanText(body.createdAt, 40) || new Date().toISOString(),
        targetCompletionDate: cleanText(body.targetCompletionDate, 20) || 'TBD',
        customerName: cleanText(body.customerName, 120) || 'Josy Textile Client',
        customerEmail,
        customerPhone: cleanText(body.customerPhone, 40) || 'N/A',
        deliveryAddress: cleanText(body.deliveryAddress, 300) || 'N/A',
        shippingLabel: cleanText(body.shippingLabel, 120) || 'Standard Shipping',
        currency,
        paymentGateway:
          cleanText(body.paymentGateway, 80) || 'Payment Pending (Studio Confirmation)',
        paymentPlan: cleanText(body.paymentPlan, 40) || 'FULL_UPFRONT',
        subtotalNGN: Number(body.subtotalNGN) || 0,
        shippingNGN: Number(body.shippingNGN) || 0,
        totalNGN: Number(body.totalNGN) || 0,
        amountPaidNGN: Number(body.amountPaidNGN) || 0,
        balanceDueNGN: Number(body.balanceDueNGN) || 0,
        balanceSettled: Boolean(body.balanceSettled),
        items,
      });

      res.status(200).json({
        filename: `Josy-Textile-Receipt-${orderId}.txt`,
        receiptText,
      });
    }
  );

  // =========================================================================
  // 3B. Authenticated Session Check, Studio Fitting Scheduler & Size Advisor
  // =========================================================================
  app.get('/api/auth/session', requireFirebaseAuth, (req: AuthenticatedRequest, res) => {
    const authUser = req.authUser;
    res.status(200).json({
      authenticated: true,
      uid: authUser?.uid || null,
      email: authUser?.email || null,
      emailVerified: Boolean(authUser?.email_verified),
      role: isVerifiedStudioAdmin(authUser) ? 'admin' : 'buyer',
    });
  });

  app.post(
    '/api/admin/whitelist/hash-password',
    writeRateLimiter,
    requireFirebaseAuth,
    requireVerifiedStudioAdmin,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const password = typeof body.password === 'string' ? body.password : '';
      const email = normalizeWhitelistEmail(cleanText(body.email, 180));
      const displayName = cleanText(body.displayName, 120);
      const note = cleanText(body.note, 240);

      if (password.length < 6 || password.length > 128) {
        res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
        return;
      }
      const { passwordHash, passwordSalt } = hashWhitelistPassword(password);
      if (email && isValidWhitelistEmail(email)) {
        upsertServerWhitelistEntry({
          email,
          displayName: displayName || 'Josy Member',
          passwordHash,
          passwordSalt,
          active: true,
          note,
        });
      }
      res.status(200).json({ passwordHash, passwordSalt });
    }
  );

  app.get(
    '/api/admin/whitelist/seed-entries',
    requireFirebaseAuth,
    requireVerifiedStudioAdmin,
    (_req: AuthenticatedRequest, res) => {
      res.status(200).json({ entries: getActiveSeedWhitelistEntries() });
    }
  );

  app.post(
    '/api/admin/whitelist/status',
    writeRateLimiter,
    requireFirebaseAuth,
    requireVerifiedStudioAdmin,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const email = normalizeWhitelistEmail(cleanText(body.email, 180));
      const active = Boolean(body.active);
      const removed = Boolean(body.removed);
      if (!isValidWhitelistEmail(email)) {
        res.status(400).json({ error: 'Invalid email address.' });
        return;
      }
      setServerWhitelistStatus(email, active, removed);
      res.status(200).json({ ok: true });
    }
  );

  app.post(
    '/api/auth/verify-whitelist-password',
    whitelistAuthRateLimiter,
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const password = typeof body.password === 'string' ? body.password : '';
      const passwordHash = cleanText(body.passwordHash, 128);
      const passwordSalt = cleanText(body.passwordSalt, 32);
      const useServerRegistry = Boolean(body.useServerRegistry);

      if (password.length < 6 || password.length > 128) {
        res.status(400).json({ valid: false, error: 'Invalid password length.' });
        return;
      }

      if (useServerRegistry) {
        const callerEmail = req.authUser?.email || '';
        const match = verifyRegisteredWhitelistCredentials(callerEmail, password);
        res.status(200).json({
          valid: match.valid,
          displayName: match.displayName,
        });
        return;
      }

      const valid = verifyWhitelistPassword(password, passwordHash, passwordSalt);
      res.status(200).json({ valid });
    }
  );

  app.post('/api/auth/whitelist-login', whitelistAuthRateLimiter, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const email = normalizeWhitelistEmail(cleanText(body.email, 180));
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidWhitelistEmail(email) || password.length < 6 || password.length > 128) {
      res.status(401).json({ ok: false, error: 'Invalid email or password.' });
      return;
    }

    const match = verifyRegisteredWhitelistCredentials(email, password);
    if (!match.valid || !match.email) {
      res.status(401).json({
        ok: false,
        error: 'Access denied: invalid credentials or email is not active on the whitelist.',
      });
      return;
    }

    const session = issueWhitelistSessionToken(match.email, match.displayName || 'Josy Member');
    res.status(200).json({
      ok: true,
      email: match.email,
      displayName: match.displayName || 'Josy Member',
      token: session.token,
      expiresAt: session.expiresAt,
    });
  });

  app.get('/api/auth/whitelist-session', (req, res) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      res.status(401).json({ valid: false });
      return;
    }
    const verified = verifyWhitelistSessionToken(token);
    if (!verified.valid) {
      res.status(401).json({ valid: false });
      return;
    }
    res.status(200).json({
      valid: true,
      email: verified.email,
      displayName: verified.displayName,
    });
  });

  app.get('/api/auth/whitelist-check', requireFirebaseAuth, (req: AuthenticatedRequest, res) => {
    const email = req.authUser?.email || '';
    const check = isEmailActiveInServerWhitelist(email);
    res.status(200).json(check);
  });

  app.get('/api/fittings/slots', (req, res) => {
    const daysParam = Number(req.query.days || 10);
    const days = Number.isFinite(daysParam) ? Math.max(1, Math.min(21, Math.floor(daysParam))) : 10;
    res.status(200).json({
      studioLocation: STUDIO_INFO.headquarters,
      operatingHours: STUDIO_INFO.hours,
      contactPhone: STUDIO_INFO.phone,
      days: getAvailableFittingSlots(days),
    });
  });

  app.post(
    '/api/fittings/validate',
    writeRateLimiter,
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const result = validateFittingBookingRequest({
        date: cleanText(body.date, 20),
        timeSlotWAT: cleanText(body.timeSlotWAT, 30),
        fittingType: cleanText(body.fittingType, 40),
        clientName: cleanText(body.clientName, 120),
        clientPhone: cleanText(body.clientPhone, 40),
        garmentInterest: cleanText(body.garmentInterest, 160),
      });

      if (!result.valid) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json(result);
    }
  );

  app.post('/api/tailoring/recommend-size', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const unit = body.unit === 'cm' ? 'cm' : 'in';
    const chestBust = Number(body.chestBust);
    const waist = Number(body.waist);

    const recommendation = recommendRtwOrLuxuryFit({ chestBust, waist, unit });
    if (!recommendation) {
      res.status(400).json({ error: 'Please provide valid chest/bust and waist measurements.' });
      return;
    }

    res.status(200).json(recommendation);
  });

  // =========================================================================
  // 4. Studio Admin Operations: Tracking, Analytics, CSV Export & Job Cards
  // =========================================================================
  app.post(
    '/api/admin/tracking/generate',
    writeRateLimiter,
    requireFirebaseAuth,
    requireVerifiedStudioAdmin,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const shippingZoneId = cleanText(body.shippingZoneId, 40);
      const track = body.track === 'BESPOKE' ? 'BESPOKE' : 'RTW';
      const zone = resolveShippingZone(shippingZoneId);

      if (!zone) {
        res.status(400).json({ error: 'Invalid shipping zone identifier.' });
        return;
      }

      const trackingCode = generateCarrierTrackingCode(zone.id, track);
      res.status(200).json({
        trackingCode,
        carrier: zone.carrier,
        eta: zone.eta,
      });
    }
  );

  app.post(
    '/api/admin/analytics/summary',
    requireFirebaseAuth,
    requireVerifiedStudioAdmin,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const rawOrders = Array.isArray(body.orders) ? body.orders.slice(0, 500) : [];
      const rawProducts = Array.isArray(body.products) ? body.products.slice(0, 300) : [];

      const sanitizedOrders: AdminOrderSummaryInput[] = rawOrders
        .filter((o): o is Record<string, unknown> => Boolean(o && typeof o === 'object'))
        .map((o) => ({
          id: cleanText(o.id, 40),
          createdAt: cleanText(o.createdAt, 40),
          targetCompletionDate: cleanText(o.targetCompletionDate, 20),
          customerName: cleanText(o.customerName, 120),
          customerEmail: cleanText(o.customerEmail, 180),
          customerPhone: cleanText(o.customerPhone, 40),
          deliveryAddress: cleanText(o.deliveryAddress, 300),
          shippingLabel: cleanText(o.shippingLabel, 120),
          currency: cleanText(o.currency, 8) || 'NGN',
          paymentGateway: cleanText(o.paymentGateway, 80),
          totalNGN: Number(o.totalNGN) || 0,
          amountPaidNGN: Number(o.amountPaidNGN) || 0,
          balanceDueNGN: Number(o.balanceDueNGN) || 0,
          balanceSettled: Boolean(o.balanceSettled),
          rtwStage: cleanText(o.rtwStage, 40) || undefined,
          rtwTrackingCode: cleanText(o.rtwTrackingCode, 60) || undefined,
          bespokeStage: cleanText(o.bespokeStage, 40) || undefined,
          bespokeTrackingCode: cleanText(o.bespokeTrackingCode, 60) || undefined,
          rtwSubtotalNGN: Number(o.rtwSubtotalNGN) || 0,
          luxurySubtotalNGN: Number(o.luxurySubtotalNGN) || 0,
          itemCount: Number(o.itemCount) || 0,
        }));

      const sanitizedProducts: AdminInventoryInput[] = rawProducts
        .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
        .map((p) => ({
          sku: cleanText(p.sku, 40),
          name: cleanText(p.name, 140),
          categoryCode: cleanText(p.categoryCode, 8),
          fulfillmentMode: cleanText(p.fulfillmentMode, 24),
          soldOutOverride: Boolean(p.soldOutOverride),
          stockBySize:
            p.stockBySize && typeof p.stockBySize === 'object'
              ? (p.stockBySize as Record<string, number>)
              : {},
        }));

      res.status(200).json(buildWorkshopAnalyticsSummary(sanitizedOrders, sanitizedProducts));
    }
  );

  app.post(
    '/api/admin/exports/orders-csv',
    writeRateLimiter,
    requireFirebaseAuth,
    requireVerifiedStudioAdmin,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const rawOrders = Array.isArray(body.orders) ? body.orders.slice(0, 500) : [];

      const sanitizedOrders: AdminOrderSummaryInput[] = rawOrders
        .filter((o): o is Record<string, unknown> => Boolean(o && typeof o === 'object'))
        .map((o) => ({
          id: cleanText(o.id, 40),
          createdAt: cleanText(o.createdAt, 40),
          targetCompletionDate: cleanText(o.targetCompletionDate, 20),
          customerName: cleanText(o.customerName, 120),
          customerEmail: cleanText(o.customerEmail, 180),
          customerPhone: cleanText(o.customerPhone, 40),
          deliveryAddress: cleanText(o.deliveryAddress, 300),
          shippingLabel: cleanText(o.shippingLabel, 120),
          currency: cleanText(o.currency, 8) || 'NGN',
          paymentGateway: cleanText(o.paymentGateway, 80),
          totalNGN: Number(o.totalNGN) || 0,
          amountPaidNGN: Number(o.amountPaidNGN) || 0,
          balanceDueNGN: Number(o.balanceDueNGN) || 0,
          balanceSettled: Boolean(o.balanceSettled),
          rtwStage: cleanText(o.rtwStage, 40) || undefined,
          rtwTrackingCode: cleanText(o.rtwTrackingCode, 60) || undefined,
          bespokeStage: cleanText(o.bespokeStage, 40) || undefined,
          bespokeTrackingCode: cleanText(o.bespokeTrackingCode, 60) || undefined,
          rtwSubtotalNGN: Number(o.rtwSubtotalNGN) || 0,
          luxurySubtotalNGN: Number(o.luxurySubtotalNGN) || 0,
          itemCount: Number(o.itemCount) || 0,
        }));

      const dateTag = new Date().toISOString().slice(0, 10);
      res.status(200).json({
        filename: `Josy-Textile-Orders-${dateTag}.csv`,
        csv: buildOrdersCsvReport(sanitizedOrders),
      });
    }
  );

  app.post(
    '/api/admin/job-card/export',
    writeRateLimiter,
    requireFirebaseAuth,
    requireVerifiedStudioAdmin,
    (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const orderId = cleanText(body.orderId, 40);
      if (!SAFE_REF_REGEX.test(orderId)) {
        res.status(400).json({ error: 'Invalid order reference.' });
        return;
      }

      const rawGarments = Array.isArray(body.garments) ? body.garments.slice(0, 20) : [];
      const garments: JobCardGarmentInput[] = rawGarments
        .filter((g): g is Record<string, unknown> => Boolean(g && typeof g === 'object'))
        .map((g) => {
          const m =
            g.measurementsIn && typeof g.measurementsIn === 'object'
              ? (g.measurementsIn as Record<string, unknown>)
              : null;
          return {
            name: cleanText(g.name, 140) || 'Custom Luxury Garment',
            sku: cleanText(g.sku, 40) || 'JT-CUSTOM',
            quantity: Math.max(1, Math.min(50, Math.floor(Number(g.quantity) || 1))),
            cutOption: cleanText(g.cutOption, 80) || 'Classic Tailored Cut',
            swatchName: cleanText(g.swatchName, 80) || 'Selected Fabric',
            swatchMaterial: cleanText(g.swatchMaterial, 80) || 'Authentic Textile',
            profileName: cleanText(g.profileName, 80) || undefined,
            fitNotes: cleanText(g.fitNotes, 500) || undefined,
            measurementsIn: m
              ? {
                  chestBust: Number(m.chestBust) || 0,
                  waist: Number(m.waist) || 0,
                  hips: Number(m.hips) || 0,
                  shoulderWidth: Number(m.shoulderWidth) || 0,
                  sleeveLength: Number(m.sleeveLength) || 0,
                  neck: Number(m.neck) || 0,
                  trouserInseam: Number(m.trouserInseam) || 0,
                  trouserOutseam: Number(m.trouserOutseam) || 0,
                  garmentLength: Number(m.garmentLength) || 0,
                }
              : undefined,
          };
        });

      const cutSheetText = buildTailorJobCardCutSheet({
        orderId,
        targetCompletionDate: cleanText(body.targetCompletionDate, 20) || 'TBD',
        currentStage: cleanText(body.currentStage, 60) || 'In Production',
        customerName: cleanText(body.customerName, 120) || 'Josy Textile Client',
        customerPhone: cleanText(body.customerPhone, 40) || 'N/A',
        customerEmail: cleanText(body.customerEmail, 180) || 'N/A',
        shippingLabel: cleanText(body.shippingLabel, 120) || 'Standard',
        deliveryAddress: cleanText(body.deliveryAddress, 300) || 'N/A',
        totalNGN: Number(body.totalNGN) || 0,
        amountPaidNGN: Number(body.amountPaidNGN) || 0,
        balanceSettled: Boolean(body.balanceSettled),
        currency: cleanText(body.currency, 8).toUpperCase() || 'NGN',
        garments,
      });

      res.status(200).json({
        filename: `Josy-Textile-JobCard-${orderId}.txt`,
        cutSheetText,
      });
    }
  );

  // =========================================================================
  // 5. Authenticated Payment Initialization & Verification (Pending by Default)
  // =========================================================================
  app.post(
    '/api/payments/initialize',
    writeRateLimiter,
    requireFirebaseAuth,
    async (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const orderId = cleanText(body.orderId, 60);
      const currency = cleanText(body.currency, 8).toUpperCase();
      const gateway = normalizeGatewayKey(cleanText(body.gateway, 80)) || 'pending';
      const amount = Number(body.amountMajor);
      const customerName = cleanText(body.customerName, 120);
      const customerEmail = req.authUser?.email || cleanText(body.customerEmail, 180);

      if (!SAFE_REF_REGEX.test(orderId)) {
        res.status(400).json({ error: 'Invalid order reference format.' });
        return;
      }
      if (!ALLOWED_CURRENCIES.has(currency) || !ALLOWED_GATEWAYS.has(gateway)) {
        res.status(400).json({ error: 'Unsupported currency or payment gateway.' });
        return;
      }

      const reference = `${orderId}-${Date.now().toString().slice(-5)}`;

      // Payment option is intentionally pending until PAYMENT_MODE=live is enabled
      if (PAYMENT_MODE === 'pending' || gateway === 'pending') {
        res.status(200).json({
          mode: 'pending',
          gateway: 'pending',
          paymentStatus: 'PENDING_CONFIRMATION',
          reference,
          authorizationUrl: null,
          message:
            'Online payment option is currently pending activation. Your order is saved and awaiting Isoko Road studio confirmation.',
        });
        return;
      }

      if (!Number.isFinite(amount) || amount <= 0 || amount > 500_000_000) {
        res.status(400).json({ error: 'Invalid payment amount.' });
        return;
      }

      const callbackBase = resolveCallbackBaseUrl(req);

    try {
      if (gateway === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: customerEmail,
            amount: Math.round(amount * 100),
            currency,
            reference,
            callback_url: `${callbackBase}/?payment_ref=${encodeURIComponent(reference)}`,
            metadata: {
              orderId,
              customerUid: req.authUser?.uid,
              customerName,
            },
          }),
        });
        const data = (await paystackRes.json()) as {
          status?: boolean;
          message?: string;
          data?: { authorization_url?: string; reference?: string };
        };
        if (!paystackRes.ok || !data.status || !data.data?.authorization_url) {
          res.status(502).json({ error: data.message || 'Paystack initialization failed.' });
          return;
        }
        res.status(200).json({
          mode: 'live',
          gateway: 'paystack',
          reference: data.data.reference || reference,
          authorizationUrl: data.data.authorization_url,
        });
        return;
      }

      if (gateway === 'flutterwave' && process.env.FLUTTERWAVE_SECRET_KEY) {
        const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tx_ref: reference,
            amount: Math.round(amount * 100) / 100,
            currency,
            redirect_url: `${callbackBase}/?payment_ref=${encodeURIComponent(reference)}`,
            customer: {
              email: customerEmail,
              name: customerName || 'Josy Textile Buyer',
            },
            customizations: {
              title: 'Josy Textile',
              description: `Order ${orderId}`,
            },
          }),
        });
        const data = (await flwRes.json()) as {
          status?: string;
          message?: string;
          data?: { link?: string };
        };
        if (!flwRes.ok || data.status !== 'success' || !data.data?.link) {
          res.status(502).json({ error: data.message || 'Flutterwave initialization failed.' });
          return;
        }
        res.status(200).json({
          mode: 'live',
          gateway: 'flutterwave',
          reference,
          authorizationUrl: data.data.link,
        });
        return;
      }

      if (gateway === 'stripe' && process.env.STRIPE_SECRET_KEY) {
        const params = new URLSearchParams({
          mode: 'payment',
          success_url: `${callbackBase}/?payment_ref=${encodeURIComponent(reference)}&status=success`,
          cancel_url: `${callbackBase}/?payment_ref=${encodeURIComponent(reference)}&status=cancelled`,
          customer_email: customerEmail,
          client_reference_id: orderId,
          'line_items[0][price_data][currency]': currency.toLowerCase(),
          'line_items[0][price_data][product_data][name]': `Josy Textile Order ${orderId}`,
          'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
          'line_items[0][quantity]': '1',
        });

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
        const data = (await stripeRes.json()) as {
          id?: string;
          url?: string;
          error?: { message?: string };
        };
        if (!stripeRes.ok || !data.url) {
          res.status(502).json({ error: data.error?.message || 'Stripe initialization failed.' });
          return;
        }
        res.status(200).json({
          mode: 'live',
          gateway: 'stripe',
          reference: data.id || reference,
          authorizationUrl: data.url,
        });
        return;
      }

      res.status(200).json({
        mode: 'preview',
        gateway,
        reference,
        authorizationUrl: null,
      });
    } catch (err) {
      console.error('Payment initialization error:', err);
      res.status(500).json({ error: 'Unable to initialize payment gateway.' });
    }
  });

  app.post('/api/payments/verify', requireFirebaseAuth, async (req: AuthenticatedRequest, res) => {
    const body = req.body as Record<string, unknown>;
    const reference = cleanText(body.reference, 128);
    const gateway = normalizeGatewayKey(cleanText(body.gateway, 80)) || 'pending';

    if (!SAFE_REF_REGEX.test(reference)) {
      res.status(400).json({ error: 'Invalid transaction reference.' });
      return;
    }

    if (PAYMENT_MODE === 'pending' || gateway === 'pending') {
      res.status(200).json({
        mode: 'pending',
        verified: false,
        status: 'pending_confirmation',
      });
      return;
    }

    try {
      if (gateway === 'paystack' && process.env.PAYSTACK_SECRET_KEY) {
        const resp = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
          }
        );
        const data = (await resp.json()) as {
          status?: boolean;
          data?: { status?: string };
        };
        res.status(200).json({
          mode: 'live',
          verified: Boolean(data.status && data.data?.status === 'success'),
          status: data.data?.status || 'unknown',
        });
        return;
      }

      if (gateway === 'flutterwave' && process.env.FLUTTERWAVE_SECRET_KEY) {
        const resp = await fetch(
          `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
          {
            headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
          }
        );
        const data = (await resp.json()) as {
          status?: string;
          data?: { status?: string };
        };
        res.status(200).json({
          mode: 'live',
          verified: Boolean(data.status === 'success' && data.data?.status === 'successful'),
          status: data.data?.status || 'unknown',
        });
        return;
      }

      if (gateway === 'stripe' && process.env.STRIPE_SECRET_KEY) {
        const resp = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(reference)}`,
          {
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          }
        );
        const data = (await resp.json()) as {
          payment_status?: string;
          status?: string;
        };
        res.status(200).json({
          mode: 'live',
          verified: Boolean(resp.ok && data.payment_status === 'paid'),
          status: data.payment_status || data.status || 'unknown',
        });
        return;
      }

      res.status(200).json({
        mode: 'preview',
        verified: true,
        status: 'preview_confirmed',
      });
    } catch (err) {
      console.error('Payment verification error:', err);
      res.status(500).json({ error: 'Unable to verify transaction.' });
    }
  });

  // =========================================================================
  // 4. Transactional Order Milestone & Studio Request Notifications
  // =========================================================================
  app.post(
    '/api/notifications/milestone',
    requireFirebaseAuth,
    async (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const orderId = cleanText(body.orderId, 60);
      const stage = cleanText(body.stage, 80);
      const message = cleanText(body.message, 400);
      const recipientEmail = cleanText(body.recipientEmail, 180);
      const recipientPhone = cleanText(body.recipientPhone, 30).replace(/[^\d+]/g, '');
      const whatsappOptIn = Boolean(body.whatsappOptIn);

      if (!SAFE_REF_REGEX.test(orderId) || !stage || !message) {
        res.status(400).json({ error: 'Invalid milestone notification payload.' });
        return;
      }

      const isAdminCaller = isVerifiedStudioAdmin(req.authUser);
      const isSelfEmail =
        Boolean(req.authUser?.email) &&
        recipientEmail.toLowerCase() === req.authUser?.email?.toLowerCase();

      if (!isAdminCaller && !isSelfEmail) {
        res.status(403).json({ error: 'Not authorized to send alerts to this recipient.' });
        return;
      }

      const delivery = {
        email: 'logged_preview',
        whatsapp: whatsappOptIn ? 'logged_preview' : 'skipped',
      };

      if (process.env.RESEND_API_KEY && recipientEmail) {
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'Josy Textile <orders@josytextile.com>',
              to: [recipientEmail],
              subject: `Josy Textile Order ${orderId} — ${stage}`,
              text: `${message}\n\nJosy Textile · Isoko Road, Ughelli, Delta State\nPhone / WhatsApp: 07032802844 · Email: ${STUDIO_CONTACT_EMAIL}`,
            }),
          });
          delivery.email = emailRes.ok ? 'sent' : 'failed';
        } catch {
          delivery.email = 'failed';
        }
      }

      if (
        whatsappOptIn &&
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
        recipientPhone.length >= 10
      ) {
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID.replace(/[^\d]/g, '');
        const cleanDigits = recipientPhone.replace(/^\+/, '');
        try {
          const waRes = await fetch(
            `https://graph.facebook.com/v21.0/${phoneId}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: cleanDigits,
                type: 'text',
                text: {
                  body: `Josy Textile (${orderId}) — ${stage}: ${message}`,
                },
              }),
            }
          );
          delivery.whatsapp = waRes.ok ? 'sent' : 'failed';
        } catch {
          delivery.whatsapp = 'failed';
        }
      }

      res.status(200).json({ ok: true, delivery });
    }
  );

  app.post(
    '/api/notifications/studio-inquiry',
    requireFirebaseAuth,
    async (req: AuthenticatedRequest, res) => {
      const body = req.body as Record<string, unknown>;
      const senderName = cleanText(body.name, 120);
      const senderEmail = req.authUser?.email || cleanText(body.email, 180);
      const subject = cleanText(body.subject, 160);
      const message = cleanText(body.message, 2000);

      if (senderName.length < 2 || !subject || message.length < 5) {
        res.status(400).json({ error: 'Invalid studio request payload.' });
        return;
      }

      let emailStatus = 'logged_preview';
      if (process.env.RESEND_API_KEY) {
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'Josy Textile <concierge@josytextile.com>',
              to: [STUDIO_CONTACT_EMAIL],
              reply_to: senderEmail,
              subject: `[Josy Textile Request] ${subject}`,
              text: `From: ${senderName} (${senderEmail})\nUID: ${req.authUser?.uid}\n\n${message}`,
            }),
          });
          emailStatus = emailRes.ok ? 'sent' : 'failed';
        } catch {
          emailStatus = 'failed';
        }
      }

      res.status(200).json({ ok: true, emailStatus });
    }
  );

  // Clean JSON 404 fallback for unmatched /api/* endpoints
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // =========================================================================
  // 6. Frontend Mounting: Vite Middleware (Dev) vs. Static `dist/` (Prod)
  // =========================================================================
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    const indexHtml = path.resolve(distDir, 'index.html');
    app.use(express.static(distDir, { maxAge: '1d', index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(indexHtml);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `Josy Textile full-stack server running on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`
    );
  });
}

void createServer();
