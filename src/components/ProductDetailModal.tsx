import React, { useEffect, useState } from 'react';
import { Check, Heart, Ruler, ShieldCheck, X } from 'lucide-react';
import { formatMoney, inToCm, isProductSoldOut, SIZES } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { BespokeSpec, SizeCode } from '../types/josy';
import { MeasurementDrawer } from './MeasurementDrawer';

const SIZE_CHART_IN: Array<{
  size: SizeCode;
  chest: number;
  waist: number;
  hip: number;
  shoulder: number;
}> = [
  { size: 'S', chest: 37, waist: 31, hip: 37, shoulder: 17.0 },
  { size: 'M', chest: 40, waist: 33, hip: 39.5, shoulder: 18.0 },
  { size: 'L', chest: 43, waist: 36, hip: 42, shoulder: 19.0 },
  { size: 'XL', chest: 46, waist: 39, hip: 45, shoulder: 20.0 },
  { size: '2XL', chest: 49, waist: 42, hip: 48, shoulder: 21.0 },
  { size: '3XL', chest: 52, waist: 45, hip: 51, shoulder: 22.0 },
];

export function ProductDetailModal() {
  const {
    selectedProduct,
    setSelectedProduct,
    currency,
    settings,
    addToCart,
    wishlistIds,
    toggleWishlist,
    measurementProfiles,
  } = useStore();

  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'RTW' | 'BESPOKE'>('RTW');
  const [selectedSize, setSelectedSize] = useState<SizeCode>('L');
  const [selectedSwatchIdx, setSelectedSwatchIdx] = useState(0);
  const [selectedCutIdx, setSelectedCutIdx] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideUnit, setSizeGuideUnit] = useState<'in' | 'cm'>('in');
  const [measurementDrawerOpen, setMeasurementDrawerOpen] = useState(false);
  const [attachedBespokeSpec, setAttachedBespokeSpec] = useState<BespokeSpec | null>(null);

  useEffect(() => {
    if (!selectedProduct) return;
    setActiveImage(selectedProduct.image);
    setSelectedSwatchIdx(0);
    setSelectedCutIdx(0);
    setAttachedBespokeSpec(null);
    setSizeGuideOpen(false);
    setMeasurementDrawerOpen(false);

    if (selectedProduct.fulfillmentMode === 'BESPOKE_ONLY') {
      setSelectedMode('BESPOKE');
    } else {
      setSelectedMode('RTW');
      const firstAvailable = SIZES.find((s) => (selectedProduct.stockBySize[s] || 0) > 0);
      setSelectedSize(firstAvailable || 'L');
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const isWishlisted = wishlistIds.includes(selectedProduct.id);
  const soldOut = isProductSoldOut(selectedProduct);
  const activeSwatch = selectedProduct.swatches[selectedSwatchIdx] || selectedProduct.swatches[0];
  const activeCut = selectedProduct.cutOptions[selectedCutIdx] || selectedProduct.cutOptions[0];
  const currentSizeStock = selectedProduct.stockBySize[selectedSize] || 0;

  const effectivePriceNGN =
    selectedMode === 'BESPOKE'
      ? selectedProduct.priceNGN + selectedProduct.bespokeSurchargeNGN
      : selectedProduct.priceNGN;

  const bespokePaused = selectedMode === 'BESPOKE' && !settings.bespokeCapacityOpen;

  const handlePrimaryAction = () => {
    if (soldOut || bespokePaused) return;
    if (selectedMode === 'RTW') {
      if (currentSizeStock <= 0) return;
      addToCart({
        productId: selectedProduct.id,
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        image: selectedProduct.image,
        selectedMode: 'RTW',
        size: selectedSize,
        swatch: activeSwatch,
        cutOption: activeCut,
        unitPriceNGN: effectivePriceNGN,
        quantity: 1,
      });
      setSelectedProduct(null);
    } else {
      if (!attachedBespokeSpec) {
        setMeasurementDrawerOpen(true);
        return;
      }
      addToCart({
        productId: selectedProduct.id,
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        image: selectedProduct.image,
        selectedMode: 'BESPOKE',
        swatch: activeSwatch,
        cutOption: activeCut,
        unitPriceNGN: effectivePriceNGN,
        quantity: 1,
        bespokeSpec: attachedBespokeSpec,
      });
      setSelectedProduct(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-6 overflow-y-auto"
        onClick={() => setSelectedProduct(null)}
      >
        <div
          className="bg-white w-full max-w-6xl max-h-full sm:max-h-[92vh] overflow-y-auto border border-[#E4E4E0] shadow-2xl grid grid-cols-1 lg:grid-cols-12 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedProduct(null)}
            aria-label="Close product view"
            className="absolute right-4 top-4 z-20 w-10 h-10 bg-white/90 border border-[#E4E4E0] flex items-center justify-center text-[#111113] hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Column: Editorial Gallery */}
          <div className="lg:col-span-6 bg-[#F2F2F0] flex flex-col">
            <div className="aspect-[3/4] w-full overflow-hidden bg-[#EAEAE6]">
              <img
                src={activeImage || selectedProduct.image}
                alt={selectedProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex items-center justify-between gap-4 border-t border-[#E4E4E0] bg-white">
              <div className="flex items-center gap-2.5">
                {[selectedProduct.image, selectedProduct.secondaryImage].map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-14 h-16 overflow-hidden border transition-colors cursor-pointer ${
                      activeImage === imgUrl ? 'border-[#111113]' : 'border-[#E4E4E0] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${selectedProduct.name} view ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#71717A] text-right">{selectedProduct.modelNote}</p>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Quiet Unboxed Metadata */}
              <div>
                <div className="flex items-center gap-2 text-xs text-[#71717A]">
                  <span className="font-mono">{selectedProduct.categoryCode}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedProduct.categoryName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{selectedProduct.sku}</span>
                </div>
                <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#111113] mt-2 leading-tight">
                  {selectedProduct.name}
                </h2>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-mono text-2xl font-medium text-[#111113] tabular-nums">
                    {formatMoney(effectivePriceNGN, currency)}
                  </span>
                  {selectedMode === 'BESPOKE' && selectedProduct.bespokeSurchargeNGN > 0 && (
                    <span className="text-xs text-[#71717A]">
                      Includes custom pattern drafting (+
                      {formatMoney(selectedProduct.bespokeSurchargeNGN, currency)})
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-[#52525B] leading-relaxed">{selectedProduct.description}</p>

              {/* Dual-Mode Fulfillment Toggle (HYBRID SKUs) */}
              {selectedProduct.fulfillmentMode === 'HYBRID' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#27272A]">Select Fulfillment Mode</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMode('RTW')}
                      className={`p-3.5 text-left border transition-colors cursor-pointer ${
                        selectedMode === 'RTW'
                          ? 'border-[#111113] bg-[#111113] text-white'
                          : 'border-[#D4D4D8] bg-white text-[#27272A] hover:border-[#111113]'
                      }`}
                    >
                      <p className="text-xs font-semibold">Buy Standard Size</p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          selectedMode === 'RTW' ? 'text-[#D4D4D8]' : 'text-[#71717A]'
                        }`}
                      >
                        Ships in 24–48 hrs · S–3XL
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMode('BESPOKE')}
                      className={`p-3.5 text-left border transition-colors cursor-pointer ${
                        selectedMode === 'BESPOKE'
                          ? 'border-[#1B365D] bg-[#1B365D] text-white'
                          : 'border-[#D4D4D8] bg-white text-[#27272A] hover:border-[#1B365D]'
                      }`}
                    >
                      <p className="text-xs font-semibold">Order Custom Fit</p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          selectedMode === 'BESPOKE' ? 'text-[#CBD5E1]' : 'text-[#71717A]'
                        }`}
                      >
                        Tailored to measurements · {settings.bespokeLeadWindow}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode Notice for RTW_ONLY / BESPOKE_ONLY */}
              {selectedProduct.fulfillmentMode === 'BESPOKE_ONLY' && (
                <div className="p-3.5 bg-[#F4F6F9] border border-[#D6DFEC] text-xs text-[#1B365D] flex items-center justify-between gap-3">
                  <span>
                    Made-to-Measure Exclusively · Hand-tailored in Ughelli ({settings.bespokeLeadWindow})
                  </span>
                  {settings.splitDepositEnabled && (
                    <span className="font-mono whitespace-nowrap shrink-0">60% Deposit Eligible</span>
                  )}
                </div>
              )}

              {/* Interactive Fabric & Textile Swatches */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#27272A]">Fabric & Print Swatch</span>
                  <span className="text-[#71717A]">
                    {activeSwatch.name} · {activeSwatch.material}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {selectedProduct.swatches.map((swatch, idx) => (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => setSelectedSwatchIdx(idx)}
                      className={`flex items-center gap-2.5 px-3 py-2 border text-xs transition-colors cursor-pointer ${
                        selectedSwatchIdx === idx
                          ? 'border-[#111113] bg-[#FAFAFA] text-[#111113] font-medium'
                          : 'border-[#E4E4E0] text-[#52525B] hover:border-[#A1A1AA]'
                      }`}
                    >
                      <span
                        className="w-5 h-5 border border-black/15 shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${swatch.hexPrimary} 45%, ${swatch.hexSecondary} 45%, ${swatch.hexSecondary} 72%, ${swatch.hexAccent} 72%)`,
                        }}
                      />
                      <span>{swatch.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cut / Styling Options */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#27272A]">Silhouette & Cut Option</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.cutOptions.map((cut, idx) => (
                    <button
                      key={cut}
                      type="button"
                      onClick={() => setSelectedCutIdx(idx)}
                      className={`px-3.5 py-2 text-xs border transition-colors cursor-pointer ${
                        selectedCutIdx === idx
                          ? 'border-[#111113] bg-[#111113] text-white'
                          : 'border-[#D4D4D8] text-[#3F3F46] hover:border-[#111113]'
                      }`}
                    >
                      {cut}
                    </button>
                  ))}
                </div>
              </div>

              {/* Standard S-3XL Size Matrix (RTW mode) */}
              {selectedMode === 'RTW' && !soldOut && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#27272A]">
                      Select Standard Size (S–3XL)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="flex items-center gap-1 text-[#1B365D] hover:underline cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Size & Fit Guide (in / cm)</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {SIZES.map((size) => {
                      const count = selectedProduct.stockBySize[size] || 0;
                      const disabled = count <= 0;
                      const active = selectedSize === size && !disabled;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedSize(size)}
                          className={`py-2.5 text-xs font-mono border transition-colors ${
                            disabled
                              ? 'border-[#F4F4F5] bg-[#FAFAFA] text-[#D4D4D8] line-through cursor-not-allowed'
                              : active
                                ? 'border-[#111113] bg-[#111113] text-white cursor-pointer'
                                : 'border-[#D4D4D8] text-[#111113] hover:border-[#111113] cursor-pointer'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[#71717A] tabular-nums">
                    {currentSizeStock > 0
                      ? currentSizeStock <= 3
                        ? `Low stock: only ${currentSizeStock} left in Size ${selectedSize} — immediate dispatch`
                        : `${currentSizeStock} units in stock (Size ${selectedSize}) — ships in 24–48 hrs`
                      : 'Selected size currently out of stock'}
                  </p>
                </div>
              )}

              {/* Bespoke Measurement Capture Summary (BESPOKE mode) */}
              {selectedMode === 'BESPOKE' && (
                <div className="p-4 border border-[#E4E4E0] bg-[#FAFAFA] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[#111113]">
                      Body Measurement Specification
                    </p>
                    <button
                      type="button"
                      onClick={() => setMeasurementDrawerOpen(true)}
                      className="text-xs font-medium text-[#1B365D] hover:underline cursor-pointer"
                    >
                      {attachedBespokeSpec ? 'Edit Measurements' : 'Open Measurement Drawer'}
                    </button>
                  </div>

                  {attachedBespokeSpec ? (
                    <div className="text-xs text-[#3F3F46] space-y-1.5">
                      <p className="flex items-center gap-1.5 font-medium text-[#1B365D]">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          Attached Profile: {attachedBespokeSpec.profileName || 'Custom Metrics'}
                        </span>
                      </p>
                      <p className="font-mono text-[11px] text-[#52525B] tabular-nums">
                        Chest {attachedBespokeSpec.measurementsIn.chestBust}&quot; · Waist{' '}
                        {attachedBespokeSpec.measurementsIn.waist}&quot; · Shoulder{' '}
                        {attachedBespokeSpec.measurementsIn.shoulderWidth}&quot; · Length{' '}
                        {attachedBespokeSpec.measurementsIn.garmentLength}&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-xs text-[#52525B]">
                        Attach one of your saved profiles or enter exact body metrics with our visual guide.
                      </p>
                      {measurementProfiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {measurementProfiles.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() =>
                                setAttachedBespokeSpec({
                                  profileName: p.name,
                                  measurementsIn: p.measurements,
                                  fitNotes: p.notes,
                                })
                              }
                              className="px-3 py-1.5 text-xs bg-white border border-[#D4D4D8] hover:border-[#1B365D] text-[#27272A] cursor-pointer"
                            >
                              Use &ldquo;{p.name}&rdquo;
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Craftsmanship List */}
              <ul className="space-y-1.5 text-xs text-[#52525B] border-t border-[#E4E4E0] pt-4">
                {selectedProduct.craftDetails.map((detail) => (
                  <li key={detail} className="flex items-start gap-2">
                    <span className="text-[#B48436] mt-0.5">—</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary Action Bar */}
            <div className="pt-4 border-t border-[#E4E4E0] space-y-3">
              {bespokePaused && (
                <p className="text-xs text-[#991B1B]">
                  Peak season notice: Custom tailoring slots are temporarily paused by our Isoko Road workshop. Standard RTW sizes remain available.
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={soldOut || bespokePaused || (selectedMode === 'RTW' && currentSizeStock <= 0)}
                  onClick={handlePrimaryAction}
                  className="flex-1 py-3.5 px-6 bg-[#111113] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#1B365D] transition-colors disabled:bg-[#D4D4D8] disabled:text-[#71717A] disabled:cursor-not-allowed cursor-pointer"
                >
                  {soldOut
                    ? 'Sold Out — Limited Edition'
                    : bespokePaused
                      ? 'Luxury Queue Temporarily Full'
                      : selectedMode === 'BESPOKE'
                        ? attachedBespokeSpec
                          ? `Add Custom-Tailored Piece · ${formatMoney(effectivePriceNGN, currency)}`
                          : 'Enter Custom Measurements'
                        : `Add Size ${selectedSize} to Bag · ${formatMoney(effectivePriceNGN, currency)}`}
                </button>
                <button
                  type="button"
                  onClick={() => void toggleWishlist(selectedProduct.id)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`w-12 h-12 border flex items-center justify-center transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'border-[#1B365D] bg-[#F4F6F9] text-[#1B365D]'
                      : 'border-[#D4D4D8] text-[#52525B] hover:border-[#111113]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#71717A]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authentic Textiles · Paystack, Flutterwave & Stripe</span>
                </span>
                <span>Ughelli Pickup or Global Express</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Size & Fit Guide Modal (Inches & Centimeters) */}
      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            className="bg-white w-full max-w-2xl border border-[#E4E4E0] p-6 sm:p-8 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-4">
              <div>
                <p className="text-xs text-[#71717A]">Josy Textile Standard Sizing</p>
                <h3 className="font-editorial text-2xl font-medium text-[#111113]">
                  Inclusive Size & Fit Guide (S–3XL)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex border border-[#E4E4E0] p-0.5 bg-[#F4F4F5]">
                  <button
                    type="button"
                    onClick={() => setSizeGuideUnit('in')}
                    className={`px-2.5 py-1 text-xs font-mono cursor-pointer ${
                      sizeGuideUnit === 'in' ? 'bg-[#111113] text-white' : 'text-[#52525B]'
                    }`}
                  >
                    in
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizeGuideUnit('cm')}
                    className={`px-2.5 py-1 text-xs font-mono cursor-pointer ${
                      sizeGuideUnit === 'cm' ? 'bg-[#111113] text-white' : 'text-[#52525B]'
                    }`}
                  >
                    cm
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(false)}
                  className="p-1.5 text-[#52525B] hover:text-[#111113] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-[#52525B]">{selectedProduct.modelNote}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E4E4E0] text-[#71717A]">
                    <th className="py-2.5 pr-4 font-medium">Size</th>
                    <th className="py-2.5 px-4 font-medium">Chest / Bust ({sizeGuideUnit})</th>
                    <th className="py-2.5 px-4 font-medium">Waist ({sizeGuideUnit})</th>
                    <th className="py-2.5 px-4 font-medium">Hips ({sizeGuideUnit})</th>
                    <th className="py-2.5 pl-4 font-medium">Shoulder ({sizeGuideUnit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F5] font-mono tabular-nums text-[#111113]">
                  {SIZE_CHART_IN.map((row) => (
                    <tr key={row.size}>
                      <td className="py-2.5 pr-4 font-semibold">{row.size}</td>
                      <td className="py-2.5 px-4">
                        {sizeGuideUnit === 'in' ? row.chest : inToCm(row.chest)}
                      </td>
                      <td className="py-2.5 px-4">
                        {sizeGuideUnit === 'in' ? row.waist : inToCm(row.waist)}
                      </td>
                      <td className="py-2.5 px-4">
                        {sizeGuideUnit === 'in' ? row.hip : inToCm(row.hip)}
                      </td>
                      <td className="py-2.5 pl-4">
                        {sizeGuideUnit === 'in' ? row.shoulder : inToCm(row.shoulder)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-[#71717A]">
              Between sizes or prefer exact body proportions? Select <strong>Order Custom Fit</strong> on any Hybrid or Luxury piece to tailor directly at our Isoko Road studio.
            </p>
          </div>
        </div>
      )}

      {/* Guided Custom Measurement Drawer */}
      <MeasurementDrawer
        isOpen={measurementDrawerOpen}
        onClose={() => setMeasurementDrawerOpen(false)}
        title={`Custom Fit Metrics — ${selectedProduct.name}`}
        submitLabel="Attach Measurements & Add to Bag"
        onConfirm={(spec) => {
          setAttachedBespokeSpec(spec);
          addToCart({
            productId: selectedProduct.id,
            sku: selectedProduct.sku,
            name: selectedProduct.name,
            image: selectedProduct.image,
            selectedMode: 'BESPOKE',
            swatch: activeSwatch,
            cutOption: activeCut,
            unitPriceNGN: effectivePriceNGN,
            quantity: 1,
            bespokeSpec: spec,
          });
          setSelectedProduct(null);
        }}
      />
    </>
  );
}
