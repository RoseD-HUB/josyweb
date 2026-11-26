import { formatCurrencyAmount, STUDIO_INFO } from './studioData.ts';

export interface AdminOrderSummaryInput {
  id: string;
  createdAt: string;
  targetCompletionDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  shippingLabel: string;
  currency: string;
  paymentGateway: string;
  totalNGN: number;
  amountPaidNGN: number;
  balanceDueNGN: number;
  balanceSettled: boolean;
  rtwStage?: string;
  rtwTrackingCode?: string;
  bespokeStage?: string;
  bespokeTrackingCode?: string;
  rtwSubtotalNGN: number;
  luxurySubtotalNGN: number;
  itemCount: number;
}

export interface AdminInventoryInput {
  sku: string;
  name: string;
  categoryCode: string;
  fulfillmentMode: string;
  soldOutOverride?: boolean;
  stockBySize: Record<string, number>;
}

export interface JobCardGarmentInput {
  name: string;
  sku: string;
  quantity: number;
  cutOption: string;
  swatchName: string;
  swatchMaterial: string;
  profileName?: string;
  fitNotes?: string;
  measurementsIn?: {
    chestBust: number;
    waist: number;
    hips: number;
    shoulderWidth: number;
    sleeveLength: number;
    neck: number;
    trouserInseam: number;
    trouserOutseam: number;
    garmentLength: number;
  };
}

/**
 * Escapes CSV cells safely and neutralizes spreadsheet formula injection (=, +, -, @, tab, CR).
 */
function safeCsvCell(value: string | number | boolean | null | undefined): string {
  const raw = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function buildWorkshopAnalyticsSummary(
  orders: AdminOrderSummaryInput[],
  products: AdminInventoryInput[],
  now = new Date()
) {
  const todayIso = now.toISOString().slice(0, 10);
  let rtwRevenueNGN = 0;
  let luxuryRevenueNGN = 0;
  let totalOrderValueNGN = 0;
  let pendingConfirmationValueNGN = 0;
  let activeRtwOrders = 0;
  let activeLuxuryJobs = 0;
  let completedOrders = 0;
  let overdueJobs = 0;

  for (const order of orders) {
    rtwRevenueNGN += order.rtwSubtotalNGN;
    luxuryRevenueNGN += order.luxurySubtotalNGN;
    totalOrderValueNGN += order.totalNGN;
    if (!order.balanceSettled) {
      pendingConfirmationValueNGN += order.balanceDueNGN;
    }

    const rtwActive = Boolean(order.rtwStage && order.rtwStage !== 'NONE' && order.rtwStage !== 'Delivered');
    const luxActive = Boolean(
      order.bespokeStage && order.bespokeStage !== 'NONE' && order.bespokeStage !== 'Delivered'
    );
    if (rtwActive) activeRtwOrders += 1;
    if (luxActive) activeLuxuryJobs += 1;
    if (!rtwActive && !luxActive) completedOrders += 1;

    if ((rtwActive || luxActive) && order.targetCompletionDate && order.targetCompletionDate < todayIso) {
      overdueJobs += 1;
    }
  }

  const lowStockAlerts: Array<{ sku: string; name: string; size: string; count: number }> = [];
  const outOfStockAlerts: Array<{ sku: string; name: string; size: string }> = [];

  for (const product of products) {
    if (product.fulfillmentMode === 'BESPOKE_ONLY' || product.soldOutOverride) continue;
    for (const [size, rawCount] of Object.entries(product.stockBySize || {})) {
      const count = Number(rawCount) || 0;
      if (count === 0) {
        outOfStockAlerts.push({ sku: product.sku, name: product.name, size });
      } else if (count <= 3) {
        lowStockAlerts.push({ sku: product.sku, name: product.name, size, count });
      }
    }
  }

  return {
    generatedAt: now.toISOString(),
    totalOrders: orders.length,
    activeRtwOrders,
    activeLuxuryJobs,
    completedOrders,
    overdueJobs,
    rtwRevenueNGN: Math.round(rtwRevenueNGN),
    luxuryRevenueNGN: Math.round(luxuryRevenueNGN),
    totalOrderValueNGN: Math.round(totalOrderValueNGN),
    pendingConfirmationValueNGN: Math.round(pendingConfirmationValueNGN),
    lowStockCount: lowStockAlerts.length,
    outOfStockCount: outOfStockAlerts.length,
    lowStockAlerts: lowStockAlerts.slice(0, 40),
    outOfStockAlerts: outOfStockAlerts.slice(0, 40),
  };
}

export function buildOrdersCsvReport(orders: AdminOrderSummaryInput[]): string {
  const header = [
    'Order ID',
    'Order Date',
    'Target Completion',
    'Client Name',
    'Client Email',
    'Client Phone',
    'Shipping Corridor',
    'Delivery Address',
    'Items Count',
    'Currency',
    'Total (NGN)',
    'Recorded Paid (NGN)',
    'Pending Balance (NGN)',
    'Payment Status',
    'RTW Stage',
    'RTW Tracking',
    'Luxury Stage',
    'Luxury Tracking',
  ];

  const rows = orders.map((o) => {
    const paymentStatus = o.balanceSettled
      ? 'Settled'
      : o.amountPaidNGN === 0
        ? 'Pending Studio Confirmation'
        : 'Partial Deposit';
    return [
      safeCsvCell(o.id),
      safeCsvCell(o.createdAt.slice(0, 10)),
      safeCsvCell(o.targetCompletionDate),
      safeCsvCell(o.customerName),
      safeCsvCell(o.customerEmail),
      safeCsvCell(o.customerPhone),
      safeCsvCell(o.shippingLabel),
      safeCsvCell(o.deliveryAddress),
      safeCsvCell(o.itemCount),
      safeCsvCell(o.currency),
      safeCsvCell(Math.round(o.totalNGN)),
      safeCsvCell(Math.round(o.amountPaidNGN)),
      safeCsvCell(Math.round(o.balanceDueNGN)),
      safeCsvCell(paymentStatus),
      safeCsvCell(o.rtwStage || 'NONE'),
      safeCsvCell(o.rtwTrackingCode || ''),
      safeCsvCell(o.bespokeStage || 'NONE'),
      safeCsvCell(o.bespokeTrackingCode || ''),
    ].join(',');
  });

  return [header.map(safeCsvCell).join(','), ...rows].join('\n');
}

function inToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function buildTailorJobCardCutSheet(input: {
  orderId: string;
  targetCompletionDate: string;
  currentStage: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingLabel: string;
  deliveryAddress: string;
  totalNGN: number;
  amountPaidNGN: number;
  balanceSettled: boolean;
  currency: string;
  garments: JobCardGarmentInput[];
}): string {
  const bar = '====================================================================';
  const line = '--------------------------------------------------------------------';
  const clearance = input.balanceSettled
    ? 'CLEARED (Paid in Full)'
    : input.amountPaidNGN === 0
      ? 'PAYMENT PENDING — Confirm with Studio Before Dispatch'
      : 'PARTIAL DEPOSIT — Collect 40% Balance Upon QC';

  const out: string[] = [
    bar,
    `  ${STUDIO_INFO.brand.toUpperCase()} — ISOKO ROAD TAILOR WORKSHOP CUT SHEET`,
    `  Studio: ${STUDIO_INFO.headquarters}`,
    `  Phone: ${STUDIO_INFO.phone}  |  Email: ${STUDIO_INFO.email}`,
    bar,
    `ORDER ID:            ${input.orderId}`,
    `TARGET COMPLETION:   ${input.targetCompletionDate}`,
    `CURRENT STAGE:       ${input.currentStage}`,
    `ORDER VALUE:         ${formatCurrencyAmount(input.totalNGN, input.currency)}`,
    `PAYMENT CLEARANCE:   ${clearance}`,
    '',
    line,
    'CLIENT & DELIVERY',
    line,
    `Client:              ${input.customerName}`,
    `Phone / WhatsApp:    ${input.customerPhone}`,
    `Email:               ${input.customerEmail}`,
    `Corridor:            ${input.shippingLabel}`,
    `Address:             ${input.deliveryAddress}`,
    '',
  ];

  if (input.garments.length === 0) {
    out.push('Ready-to-Wear order only — no custom cutting measurements required.');
  } else {
    input.garments.forEach((g, idx) => {
      const m = g.measurementsIn;
      let estYards = 4;
      if (m && (m.chestBust >= 46 || m.garmentLength >= 44)) estYards = 5;
      if (m && (m.chestBust >= 54 || m.garmentLength >= 54)) estYards = 6;

      out.push(line);
      out.push(`GARMENT #${idx + 1}: ${g.name}  (SKU: ${g.sku} · QTY: ${g.quantity})`);
      out.push(`Cut Option:    ${g.cutOption}`);
      out.push(`Fabric Swatch: ${g.swatchName} (${g.swatchMaterial})`);
      out.push(`Est. Textile:  ~${estYards} yards`);
      if (g.profileName) out.push(`Profile Name:  ${g.profileName}`);
      if (m) {
        out.push('');
        out.push('  MEASUREMENT POINT          INCHES (in)      CENTIMETERS (cm)');
        const rows: Array<[string, number]> = [
          ['Chest / Bust', m.chestBust],
          ['Natural Waist', m.waist],
          ['Hips / Seat', m.hips],
          ['Shoulder Width', m.shoulderWidth],
          ['Sleeve Length', m.sleeveLength],
          ['Neck Circumference', m.neck],
          ['Garment Length', m.garmentLength],
          ['Trouser Outseam', m.trouserOutseam],
          ['Trouser Inseam', m.trouserInseam],
        ];
        for (const [label, val] of rows) {
          out.push(
            `  ${label.padEnd(26)} ${String(val).padEnd(16)} ${inToCm(val)} cm`
          );
        }
      }
      if (g.fitNotes) {
        out.push('');
        out.push(`Tailor Notes: ${g.fitNotes.replace(/[\r\n]+/g, ' ')}`);
      }
      out.push('');
    });
  }

  out.push(bar);
  out.push('Master Tailor Sign-Off: ______________________   QC Check: [ ] PASS');
  out.push(bar);
  return out.join('\n');
}
