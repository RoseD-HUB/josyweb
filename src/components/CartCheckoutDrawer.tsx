import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Minus,
  Plus,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { formatMoney, SHIPPING_ZONES } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { PaymentGateway, PaymentPlan, ShippingZoneId } from '../types/josy';

export function CartCheckoutDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    currency,
    settings,
    user,
    openAuthModal,
    placeOrder,
  } = useStore();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('+234 ');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<ShippingZoneId>('DELTA_METRO');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('FULL_UPFRONT');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(
    currency === 'NGN'
      ? 'Paystack (NGN Cards / Transfer / USSD)'
      : 'Stripe Global (Cards / Apple Pay)'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rtwItems = useMemo(() => cart.filter((i) => i.selectedMode === 'RTW'), [cart]);
  const bespokeItems = useMemo(() => cart.filter((i) => i.selectedMode === 'BESPOKE'), [cart]);

  const rtwSubtotal = useMemo(
    () => rtwItems.reduce((sum, i) => sum + i.unitPriceNGN * i.quantity, 0),
    [rtwItems]
  );
  const bespokeSubtotal = useMemo(
    () => bespokeItems.reduce((sum, i) => sum + i.unitPriceNGN * i.quantity, 0),
    [bespokeItems]
  );
  const subtotalNGN = rtwSubtotal + bespokeSubtotal;

  const selectedZone =
    SHIPPING_ZONES.find((z) => z.id === selectedZoneId) || SHIPPING_ZONES[0];
  const totalNGN = subtotalNGN + selectedZone.rateNGN;

  const splitAllowed = bespokeItems.length > 0 && settings.splitDepositEnabled;
  const effectivePlan: PaymentPlan = splitAllowed ? paymentPlan : 'FULL_UPFRONT';

  const bespokeDepositNow =
    effectivePlan === 'SPLIT_DEPOSIT_60_40'
      ? Math.round(bespokeSubtotal * 0.6)
      : bespokeSubtotal;
  const amountDueNowNGN = rtwSubtotal + bespokeDepositNow + selectedZone.rateNGN;
  const balanceUponQcNGN = totalNGN - amountDueNowNGN;

  const availableGateways: PaymentGateway[] =
    currency === 'NGN'
      ? ['Paystack (NGN Cards / Transfer / USSD)', 'Flutterwave Nigeria (NGN)']
      : ['Stripe Global (Cards / Apple Pay)', 'Flutterwave Global Cards'];

  const activeGateway: PaymentGateway = availableGateways.includes(selectedGateway)
    ? selectedGateway
    : availableGateways[0];

  if (!isCartOpen) return null;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const addressValue =
        selectedZone.id === 'UGHELLI_PICKUP'
          ? 'In-Store Pickup — Isoko Road Studio, Ughelli, Delta State'
          : deliveryAddress.trim() || selectedZone.coverage;

      const created = await placeOrder({
        customerName: customerName.trim() || user?.displayName || 'Josy Client',
        customerEmail: customerEmail.trim() || user?.email || 'client@josytextile.com',
        customerPhone: customerPhone.trim(),
        whatsappOptIn,
        deliveryAddress: addressValue,
        shippingZone: selectedZone,
        paymentGateway: activeGateway,
        paymentPlan: effectivePlan,
      });

      if (created) {
        setStep('cart');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex justify-end"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white h-full flex flex-col border-l border-[#E4E4E0] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drawer Bar */}
        <div className="px-6 py-4 border-b border-[#E4E4E0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                aria-label="Back to bag"
                className="p-1.5 -ml-1.5 text-[#52525B] hover:text-[#111113] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#111113]">
                {step === 'cart' ? 'Your Shopping Bag' : 'Secure Checkout'}
              </h2>
              <p className="text-xs text-[#71717A]">
                {step === 'cart'
                  ? 'Split-fulfillment overview: RTW & Custom Tailoring'
                  : `Paying in ${currency} via ${activeGateway.split(' ')[0]}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close shopping bag"
            className="p-2 text-[#52525B] hover:text-[#111113] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
            <ShoppingBag className="w-10 h-10 text-[#A1A1AA] stroke-[1.25]" />
            <h3 className="font-editorial text-2xl text-[#111113]">Your bag is currently empty</h3>
            <p className="text-sm text-[#71717A] max-w-xs">
              Explore our Ready-to-Wear drops for 24–48 hour dispatch or commission a luxury Nigerian garment tailored to your body metrics.
            </p>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="mt-2 px-6 py-3 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors cursor-pointer"
            >
              Continue Exploring
            </button>
          </div>
        ) : step === 'cart' ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Group 1: Ready-to-Wear Items */}
              {rtwItems.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E4E4E0]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#111113]">
                      <Truck className="w-4 h-4 text-[#1B365D]" />
                      <span>Ready-to-Wear Items ({rtwItems.length})</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#71717A]">
                      Immediate Dispatch · 24–48 hrs
                    </span>
                  </div>

                  <div className="space-y-4">
                    {rtwItems.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-4 border-b border-[#F4F4F5]">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-20 h-24 object-cover bg-[#F2F2F0] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-[#111113] leading-snug">
                              {item.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              aria-label="Remove item"
                              className="text-[#A1A1AA] hover:text-[#991B1B] p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-[#71717A] mt-1">
                            Size {item.size} · {item.swatch.name} · {item.cutOption}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-[#D4D4D8]">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-[#52525B] hover:text-[#111113] cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-mono text-xs tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#52525B] hover:text-[#111113] cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-mono text-sm font-medium text-[#111113] tabular-nums">
                              {formatMoney(item.unitPriceNGN * item.quantity, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Group 2: Custom-Tailored Items */}
              {bespokeItems.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E4E4E0]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1B365D]">
                      <Scissors className="w-4 h-4 text-[#B48436]" />
                      <span>Custom-Tailored Items ({bespokeItems.length})</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#71717A]">
                      Production Queue · {settings.bespokeLeadWindow}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {bespokeItems.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-4 border-b border-[#F4F4F5]">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-20 h-24 object-cover bg-[#F2F2F0] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-[#111113] leading-snug">
                              {item.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              aria-label="Remove bespoke item"
                              className="text-[#A1A1AA] hover:text-[#991B1B] p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-[#71717A] mt-1">
                            Luxury Fit · {item.swatch.name} · {item.cutOption}
                          </p>
                          {item.bespokeSpec && (
                            <p className="text-[11px] font-mono text-[#1B365D] mt-1.5 tabular-nums">
                              Profile: {item.bespokeSpec.profileName || 'Custom'} · Chest{' '}
                              {item.bespokeSpec.measurementsIn.chestBust}&quot; · Waist{' '}
                              {item.bespokeSpec.measurementsIn.waist}&quot;
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-[#D4D4D8]">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-[#52525B] hover:text-[#111113] cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-mono text-xs tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#52525B] hover:text-[#111113] cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-mono text-sm font-medium text-[#111113] tabular-nums">
                              {formatMoney(item.unitPriceNGN * item.quantity, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Cart Footer Summary */}
            <div className="p-6 border-t border-[#E4E4E0] bg-[#FAFAFA] space-y-4">
              <div className="space-y-2 text-sm">
                {rtwItems.length > 0 && (
                  <div className="flex justify-between text-xs text-[#52525B]">
                    <span>Ready-to-Wear Subtotal</span>
                    <span className="font-mono tabular-nums">
                      {formatMoney(rtwSubtotal, currency)}
                    </span>
                  </div>
                )}
                {bespokeItems.length > 0 && (
                  <div className="flex justify-between text-xs text-[#52525B]">
                    <span>Custom-Tailored Subtotal</span>
                    <span className="font-mono tabular-nums">
                      {formatMoney(bespokeSubtotal, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-[#111113] pt-2 border-t border-[#E4E4E0]">
                  <span>Estimated Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatMoney(subtotalNGN, currency)}
                  </span>
                </div>
              </div>

              {splitAllowed && (
                <p className="text-xs text-[#1B365D]">
                  60% production deposit option available at checkout for your custom-tailored garments.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  if (user?.displayName && !customerName) setCustomerName(user.displayName);
                  if (user?.email && !customerEmail) setCustomerEmail(user.email);
                  setStep('checkout');
                }}
                className="w-full py-3.5 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors cursor-pointer"
              >
                Proceed to Shipping & Payment
              </button>
            </div>
          </>
        ) : (
          /* Step 2: Checkout Flow */
          <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!user && (
                <div className="p-4 bg-[#F8FAFC] border border-[#1B365D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#1B365D]">
                      Buyer Account Required to Place Order
                    </p>
                    <p className="text-[11px] text-[#52525B]">
                      Register with your email and password or sign in to submit your order.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openAuthModal('signup')}
                      className="px-3.5 py-2 bg-[#111113] text-white text-[11px] font-medium hover:bg-[#1B365D] transition-colors cursor-pointer"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal('signin')}
                      className="px-3.5 py-2 border border-[#111113] text-[#111113] text-[11px] font-medium hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* Customer Contact */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
                  1. Client Details & Milestone Alerts
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="border border-[#D4D4D8] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                  />
                  <input
                    type="email"
                    required
                    maxLength={180}
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email Address"
                    className="border border-[#D4D4D8] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                  />
                </div>
                <input
                  type="tel"
                  required
                  maxLength={40}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone / WhatsApp Number (e.g., +234 803...)"
                  className="w-full border border-[#D4D4D8] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                />
                <label className="flex items-center gap-2 text-xs text-[#52525B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="accent-[#1B365D] w-4 h-4"
                  />
                  <span>Send automated Email + WhatsApp production & dispatch milestone updates</span>
                </label>
              </div>

              {/* Zone-Based Shipping & Pickup Calculator */}
              <div className="space-y-3 pt-4 border-t border-[#E4E4E0]">
                <p className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
                  2. Zone-Based Delivery & Pickup Calculator
                </p>
                <div className="space-y-2">
                  {SHIPPING_ZONES.map((zone) => {
                    const active = selectedZoneId === zone.id;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setSelectedZoneId(zone.id)}
                        className={`w-full text-left p-3.5 border transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                          active
                            ? 'border-[#111113] bg-[#F8FAFC]'
                            : 'border-[#E4E4E0] hover:border-[#A1A1AA]'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-[#111113]">{zone.label}</p>
                          <p className="text-[11px] text-[#52525B]">{zone.coverage}</p>
                          <p className="text-[11px] text-[#71717A]">
                            {zone.carrier} · {zone.eta}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#111113] whitespace-nowrap tabular-nums">
                          {zone.rateNGN === 0 ? 'FREE' : formatMoney(zone.rateNGN, currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedZoneId !== 'UGHELLI_PICKUP' && (
                  <input
                    type="text"
                    required
                    maxLength={300}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street Address, City, State / Country"
                    className="w-full border border-[#D4D4D8] px-3 py-2.5 text-sm focus:outline-none focus:border-[#111113]"
                  />
                )}
              </div>

              {/* Flexible Payment Option (100% vs 60/40 Bespoke Split) */}
              {splitAllowed && (
                <div className="space-y-2.5 pt-4 border-t border-[#E4E4E0]">
                  <p className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
                    3. Flexible Luxury Payment Structure
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('FULL_UPFRONT')}
                      className={`p-3.5 text-left border transition-colors cursor-pointer ${
                        effectivePlan === 'FULL_UPFRONT'
                          ? 'border-[#111113] bg-[#111113] text-white'
                          : 'border-[#D4D4D8] text-[#27272A]'
                      }`}
                    >
                      <p className="text-xs font-semibold">100% Full Upfront</p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          effectivePlan === 'FULL_UPFRONT' ? 'text-[#D4D4D8]' : 'text-[#71717A]'
                        }`}
                      >
                        Single checkout, zero balance remaining
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentPlan('SPLIT_DEPOSIT_60_40')}
                      className={`p-3.5 text-left border transition-colors cursor-pointer ${
                        effectivePlan === 'SPLIT_DEPOSIT_60_40'
                          ? 'border-[#1B365D] bg-[#1B365D] text-white'
                          : 'border-[#D4D4D8] text-[#27272A]'
                      }`}
                    >
                      <p className="text-xs font-semibold">60% Deposit / 40% Upon QC</p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          effectivePlan === 'SPLIT_DEPOSIT_60_40'
                            ? 'text-[#CBD5E1]'
                            : 'text-[#71717A]'
                        }`}
                      >
                        Automated balance link sent after Quality Check
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Gateway Payment Selector */}
              <div className="space-y-2.5 pt-4 border-t border-[#E4E4E0]">
                <p className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
                  {splitAllowed ? '4.' : '3.'} Payment Gateway ({currency})
                </p>
                <div className="space-y-2">
                  {availableGateways.map((gw) => (
                    <button
                      key={gw}
                      type="button"
                      onClick={() => setSelectedGateway(gw)}
                      className={`w-full p-3 border text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        activeGateway === gw
                          ? 'border-[#111113] bg-[#F8FAFC] font-medium text-[#111113]'
                          : 'border-[#E4E4E0] text-[#52525B]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#1B365D]" />
                        <span>{gw}</span>
                      </span>
                      {activeGateway === gw && <Check className="w-4 h-4 text-[#1B365D]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Summary Footer */}
            <div className="p-6 border-t border-[#E4E4E0] bg-[#FAFAFA] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#52525B]">
                  <span>Items Subtotal</span>
                  <span className="font-mono tabular-nums">{formatMoney(subtotalNGN, currency)}</span>
                </div>
                <div className="flex justify-between text-[#52525B]">
                  <span>Shipping ({selectedZone.carrier.split('/')[0].trim()})</span>
                  <span className="font-mono tabular-nums">
                    {selectedZone.rateNGN === 0 ? 'FREE' : formatMoney(selectedZone.rateNGN, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-[#111113] pt-2 border-t border-[#E4E4E0]">
                  <span>Amount Due Now</span>
                  <span className="font-mono tabular-nums">
                    {formatMoney(amountDueNowNGN, currency)}
                  </span>
                </div>
                {balanceUponQcNGN > 0 && (
                  <div className="flex justify-between text-xs text-[#1B365D]">
                    <span>40% Luxury Balance (Due upon QC)</span>
                    <span className="font-mono tabular-nums">
                      {formatMoney(balanceUponQcNGN, currency)}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting
                  ? 'Confirming Order...'
                  : user
                    ? `Complete Order · ${formatMoney(amountDueNowNGN, currency)}`
                    : `Create Buyer Account & Place Order · ${formatMoney(amountDueNowNGN, currency)}`}
              </button>
              <p className="text-[11px] text-[#71717A] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted order sync with live Isoko Road production tracking</span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
