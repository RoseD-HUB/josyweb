import { formatCurrencyAmount, STUDIO_INFO } from './studioData.ts';

export interface ReceiptLineItemInput {
  name: string;
  sku?: string;
  mode: 'RTW' | 'BESPOKE';
  quantity: number;
  unitPriceNGN: number;
  size?: string;
  swatchName?: string;
  cutOption?: string;
}

export interface ReceiptOrderInput {
  orderId: string;
  createdAt: string;
  targetCompletionDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  shippingLabel: string;
  currency: string;
  paymentGateway: string;
  paymentPlan: string;
  subtotalNGN: number;
  shippingNGN: number;
  totalNGN: number;
  amountPaidNGN: number;
  balanceDueNGN: number;
  balanceSettled: boolean;
  items: ReceiptLineItemInput[];
}

function sanitizeLine(val: string, maxLen: number): string {
  return val.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen);
}

export function buildOfficialOrderReceiptText(order: ReceiptOrderInput): string {
  const divider = '================================================================';
  const subDivider = '----------------------------------------------------------------';
  const isPaymentPending =
    order.paymentGateway.toLowerCase().includes('pending') ||
    (order.amountPaidNGN === 0 && !order.balanceSettled);

  const paymentStatusLabel = isPaymentPending
    ? 'PENDING CONFIRMATION (Studio Payment Confirmation Required)'
    : order.balanceSettled
      ? 'CONFIRMED IN FULL'
      : 'PARTIAL DEPOSIT (60/40 Luxury Split)';

  const lines: string[] = [
    divider,
    `  ${STUDIO_INFO.brand.toUpperCase()} — OFFICIAL ORDER & PRO-FORMA RECEIPT`,
    `  Founder & CEO: ${STUDIO_INFO.founder}`,
    `  Studio: ${STUDIO_INFO.headquarters}`,
    `  Phone / WhatsApp: ${STUDIO_INFO.phone}  |  Email: ${STUDIO_INFO.email}`,
    `  Hours: ${STUDIO_INFO.hours}`,
    divider,
    '',
    `Order Reference:      ${sanitizeLine(order.orderId, 40)}`,
    `Order Date:           ${sanitizeLine(order.createdAt.slice(0, 10), 20)}`,
    `Target Completion:    ${sanitizeLine(order.targetCompletionDate, 20)}`,
    `Payment Option:       ${sanitizeLine(order.paymentGateway, 80)}`,
    `Payment Status:       ${paymentStatusLabel}`,
    '',
    subDivider,
    'CLIENT & DELIVERY DETAILS',
    subDivider,
    `Client Name:          ${sanitizeLine(order.customerName, 120)}`,
    `Email:                ${sanitizeLine(order.customerEmail, 180)}`,
    `Phone / WhatsApp:     ${sanitizeLine(order.customerPhone, 40)}`,
    `Shipping Corridor:    ${sanitizeLine(order.shippingLabel, 120)}`,
    `Delivery Address:     ${sanitizeLine(order.deliveryAddress, 240)}`,
    '',
    subDivider,
    'ITEMIZED GARMENTS',
    subDivider,
  ];

  order.items.forEach((item, idx) => {
    const modeTag = item.mode === 'BESPOKE' ? 'Luxury Tailored' : 'Ready-to-Wear';
    const lineTotal = item.unitPriceNGN * item.quantity;
    const details = [
      modeTag,
      item.size ? `Size ${sanitizeLine(item.size, 10)}` : null,
      item.swatchName ? sanitizeLine(item.swatchName, 50) : null,
      item.cutOption ? sanitizeLine(item.cutOption, 50) : null,
    ]
      .filter(Boolean)
      .join(' · ');

    lines.push(
      `${String(idx + 1).padStart(2, '0')}. ${sanitizeLine(item.name, 100)} (x${item.quantity})`
    );
    if (details) {
      lines.push(`    ${details}`);
    }
    lines.push(
      `    Line Total: ${formatCurrencyAmount(lineTotal, order.currency)} (₦${Math.round(lineTotal).toLocaleString('en-NG')})`
    );
  });

  lines.push('');
  lines.push(subDivider);
  lines.push('SUMMARY');
  lines.push(subDivider);
  lines.push(
    `Items Subtotal:       ${formatCurrencyAmount(order.subtotalNGN, order.currency)}`
  );
  lines.push(
    `Shipping & Dispatch:  ${order.shippingNGN === 0 ? 'FREE' : formatCurrencyAmount(order.shippingNGN, order.currency)}`
  );
  lines.push(
    `Total Order Value:    ${formatCurrencyAmount(order.totalNGN, order.currency)}`
  );

  if (isPaymentPending) {
    lines.push(
      `Payment Due:          ${formatCurrencyAmount(order.totalNGN, order.currency)} (Pending Studio Confirmation)`
    );
    lines.push('');
    lines.push(
      'NOTE: Online payment is currently set to Pending. Our Isoko Road studio'
    );
    lines.push(
      `will confirm payment details via WhatsApp (${STUDIO_INFO.phone}) or email (${STUDIO_INFO.email}).`
    );
  } else {
    lines.push(
      `Amount Recorded:      ${formatCurrencyAmount(order.amountPaidNGN, order.currency)}`
    );
    if (order.balanceDueNGN > 0 && !order.balanceSettled) {
      lines.push(
        `Balance Due Upon QC:  ${formatCurrencyAmount(order.balanceDueNGN, order.currency)}`
      );
    }
  }

  lines.push('');
  lines.push(divider);
  lines.push('Thank you for choosing Josy Textile — Ughelli to the World.');
  lines.push(divider);

  return lines.join('\n');
}
