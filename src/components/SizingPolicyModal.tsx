import React from 'react';
import { X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function SizingPolicyModal() {
  const { isSizingPolicyOpen, setIsSizingPolicyOpen } = useStore();
  if (!isSizingPolicyOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => setIsSizingPolicyOpen(false)}
    >
      <div
        className="bg-white w-full max-w-2xl border border-[#E4E4E0] p-6 sm:p-8 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-4">
          <div>
            <p className="text-xs text-[#71717A]">Josy Textile Customer Guarantee</p>
            <h2 className="font-editorial text-3xl font-medium text-[#111113]">
              Sizing, Luxury Alterations & Delivery Policy
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsSizingPolicyOpen(false)}
            aria-label="Close sizing policy"
            className="p-2 text-[#52525B] hover:text-[#111113] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-[#52525B] leading-relaxed">
          <div>
            <h3 className="text-xs font-semibold text-[#111113] uppercase tracking-wider mb-1">
              Ready-to-Wear (S–3XL) Exchanges
            </h3>
            <p>
              Unworn standard-size RTW garments with original tags may be exchanged for another size within 7 days of delivery in Nigeria or 14 days for international diaspora shipments.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#111113] uppercase tracking-wider mb-1">
              Luxury & Custom Fit Assurance
            </h3>
            <p>
              Every made-to-measure piece passes an 18-point Quality Control inspection at our Isoko Road, Ughelli atelier before the 40% balance payment link is issued. Complimentary minor fit adjustments are included at our studio.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#111113] uppercase tracking-wider mb-1">
              Split-Fulfillment Shipping Timelines
            </h3>
            <p>
              Orders containing both RTW and Custom-Tailored items are split automatically so your in-stock garments dispatch within 24–48 hours while luxury garments enter the 10–14 business day tailoring queue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
