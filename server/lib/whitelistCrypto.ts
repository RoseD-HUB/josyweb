import crypto from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const HEX_SALT_REGEX = /^[a-f0-9]{32}$/;
const HEX_HASH_REGEX = /^[a-f0-9]{128}$/;
const EMAIL_REGEX = /^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

// Session signing secret: uses env var if provided, else cryptographically random ephemeral secret per boot
const SESSION_SIGNING_SECRET =
  process.env.WHITELIST_SESSION_SECRET && process.env.WHITELIST_SESSION_SECRET.length >= 16
    ? process.env.WHITELIST_SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface ServerWhitelistEntry {
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  active: boolean;
  note: string;
  isSeed?: boolean;
  removed?: boolean;
}

// Pre-hashed initial whitelist records (zero plaintext passwords stored)
const serverWhitelistRegistry = new Map<string, ServerWhitelistEntry>([
  [
    'roselineothuke2@gmail.com',
    {
      email: 'roselineothuke2@gmail.com',
      displayName: 'Roseline Othuke',
      passwordHash:
        '50ee9dbc1a04e19e9492dbb7cec9168b6173141c7c0fc929c0e90a59b5cb468825f571546c33d3a6d44f73edbe1343f19b573153e0d98664ddc6d924c3ab4099',
      passwordSalt: '11053eea4b846333eb9a30e65fda0ebe',
      active: true,
      note: 'Studio-approved initial whitelist member',
      isSeed: true,
      removed: false,
    },
  ],
]);

export function normalizeWhitelistEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 180);
}

export function isValidWhitelistEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function hashWhitelistPassword(password: string): {
  passwordHash: string;
  passwordSalt: string;
} {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS).toString('hex');
  return {
    passwordHash: derived,
    passwordSalt: salt,
  };
}

export function verifyWhitelistPassword(
  password: string,
  expectedHashHex: string,
  saltHex: string
): boolean {
  if (!HEX_HASH_REGEX.test(expectedHashHex) || !HEX_SALT_REGEX.test(saltHex)) {
    return false;
  }
  try {
    const derived = crypto.scryptSync(password, saltHex, SCRYPT_KEYLEN, SCRYPT_PARAMS);
    const expected = Buffer.from(expectedHashHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function getActiveSeedWhitelistEntries(): Array<{
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  active: boolean;
  note: string;
}> {
  const result: Array<{
    email: string;
    displayName: string;
    passwordHash: string;
    passwordSalt: string;
    active: boolean;
    note: string;
  }> = [];

  for (const entry of serverWhitelistRegistry.values()) {
    if (entry.isSeed && !entry.removed) {
      result.push({
        email: entry.email,
        displayName: entry.displayName,
        passwordHash: entry.passwordHash,
        passwordSalt: entry.passwordSalt,
        active: entry.active,
        note: entry.note,
      });
    }
  }
  return result;
}

export function upsertServerWhitelistEntry(entry: {
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  active: boolean;
  note?: string;
}): void {
  const email = normalizeWhitelistEmail(entry.email);
  if (!isValidWhitelistEmail(email)) return;
  if (!HEX_HASH_REGEX.test(entry.passwordHash) || !HEX_SALT_REGEX.test(entry.passwordSalt)) return;

  const existing = serverWhitelistRegistry.get(email);
  serverWhitelistRegistry.set(email, {
    email,
    displayName: entry.displayName.trim().slice(0, 120) || 'Josy Member',
    passwordHash: entry.passwordHash,
    passwordSalt: entry.passwordSalt,
    active: Boolean(entry.active),
    note: (entry.note || '').trim().slice(0, 240),
    isSeed: existing?.isSeed || false,
    removed: false,
  });
}

export function setServerWhitelistStatus(
  rawEmail: string,
  active: boolean,
  removed = false
): void {
  const email = normalizeWhitelistEmail(rawEmail);
  const existing = serverWhitelistRegistry.get(email);
  if (!existing) return;
  serverWhitelistRegistry.set(email, {
    ...existing,
    active: removed ? false : Boolean(active),
    removed: Boolean(removed),
  });
}

export function verifyRegisteredWhitelistCredentials(
  rawEmail: string,
  password: string
): { valid: boolean; email?: string; displayName?: string } {
  const email = normalizeWhitelistEmail(rawEmail);
  if (!isValidWhitelistEmail(email)) return { valid: false };

  const entry = serverWhitelistRegistry.get(email);
  if (!entry || !entry.active || entry.removed) {
    return { valid: false };
  }

  const ok = verifyWhitelistPassword(password, entry.passwordHash, entry.passwordSalt);
  if (!ok) return { valid: false };

  return {
    valid: true,
    email: entry.email,
    displayName: entry.displayName,
  };
}

export function isEmailActiveInServerWhitelist(rawEmail: string): {
  allowed: boolean;
  displayName?: string;
} {
  const email = normalizeWhitelistEmail(rawEmail);
  if (!isValidWhitelistEmail(email)) return { allowed: false };
  const entry = serverWhitelistRegistry.get(email);
  if (!entry || !entry.active || entry.removed) return { allowed: false };
  return { allowed: true, displayName: entry.displayName };
}

export function issueWhitelistSessionToken(email: string, displayName: string): {
  token: string;
  expiresAt: number;
} {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payloadJson = JSON.stringify({
    email: normalizeWhitelistEmail(email),
    displayName: displayName.trim().slice(0, 120),
    exp: expiresAt,
  });
  const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return {
    token: `${payloadB64}.${sig}`,
    expiresAt,
  };
}

export function verifyWhitelistSessionToken(
  token: string
): { valid: boolean; email?: string; displayName?: string } {
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [payloadB64, providedSig] = parts;
  if (!payloadB64 || !providedSig) return { valid: false };

  try {
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SIGNING_SECRET)
      .update(payloadB64)
      .digest('base64url');
    const a = Buffer.from(providedSig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { valid: false };
    }

    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      email?: string;
      displayName?: string;
      exp?: number;
    };
    if (!decoded.email || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return { valid: false };
    }

    // Enforce live revocation against server registry
    const entry = serverWhitelistRegistry.get(normalizeWhitelistEmail(decoded.email));
    if (entry && (!entry.active || entry.removed)) {
      return { valid: false };
    }

    return {
      valid: true,
      email: decoded.email,
      displayName: decoded.displayName || 'Josy Member',
    };
  } catch {
    return { valid: false };
  }
}
