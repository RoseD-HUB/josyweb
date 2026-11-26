import React, { useState } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { Order } from '../types/josy';
import { inToCm } from '../data/catalog';
import { downloadTailorJobCardFromServer } from '../lib/api';
import { JosyLogo } from './JosyLogo';

interface TailorJobCardPrintModalProps {
  order: Order | null;
  onClose: () => void;
}

export function TailorJobCardPrintModal({ order, onClose }: TailorJobCardPrintModalProps) {
  const [downloading, setDownloading] = useState(false);
  if (!order) return null;

  const customItems = order.bespokeItems;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-[#E4E4E0] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Non-Print Action Toolbar */}
        <div className="no-print sticky top-0 z-10 bg-[#111113] text-white px-6 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#A1A1AA]">Isoko Road Tailoring Workshop · Spec Sheet</p>
            <p className="text-sm font-mono font-medium">Job Card #{order.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                await downloadTailorJobCardFromServer(order);
                setDownloading(false);
              }}
              className="px-4 py-2 border border-white/30 text-white text-xs font-medium flex items-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Exporting...' : 'Download Cut Sheet'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-white text-[#111113] text-xs font-medium flex items-center gap-2 hover:bg-[#F4F4F5] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close job card"
              className="p-2 text-[#A1A1AA] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Spec Sheet */}
        <div id="tailor-job-card-print-area" className="p-8 sm:p-10 space-y-8 text-[#111113]">
          {/* Atelier Masthead */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#111113]">
            <div>
              <JosyLogo variant="light" size="md" />
              <p className="text-xs text-[#52525B] mt-2">
                Production Spec Sheet & Tailor Job Card · Isoko Road, Ughelli, Delta State, Nigeria
              </p>
            </div>
            <div className="text-left sm:text-right font-mono text-xs space-y-1 tabular-nums">
              <p className="text-sm font-semibold">ORDER ID: {order.id}</p>
              <p>TARGET COMPLETION: {order.targetCompletionDate}</p>
              <p>CURRENT STAGE: {order.bespokeStage || order.rtwStage || 'In Production'}</p>
            </div>
          </div>

          {/* Client & Dispatch Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs border-b border-[#E4E4E0] pb-6">
            <div>
              <p className="text-[#71717A] uppercase tracking-wider mb-1">Client</p>
              <p className="font-semibold text-sm">{order.customerName}</p>
              <p className="text-[#52525B] mt-0.5">{order.customerPhone}</p>
              <p className="text-[#52525B]">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-[#71717A] uppercase tracking-wider mb-1">Delivery Corridor</p>
              <p className="font-semibold">{order.shippingZone.label}</p>
              <p className="text-[#52525B] mt-0.5">{order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-[#71717A] uppercase tracking-wider mb-1">Payment Clearance</p>
              <p className="font-semibold">
                {order.balanceSettled
                  ? 'Cleared (100% Paid)'
                  : order.amountPaidNGN === 0
                    ? 'Payment Pending — Confirm Before Dispatch'
                    : '60% Deposit Paid — Hold Dispatch Until 40% QC Balance'}
              </p>
              <p className="font-mono text-[#52525B] mt-0.5">
                Method: {order.paymentGateway}
              </p>
            </div>
          </div>

          {/* Garment Specifications & Measurement Tables */}
          {customItems.length === 0 ? (
            <p className="text-sm text-[#52525B]">
              This order contains Ready-to-Wear items only (no custom cutting measurements required).
            </p>
          ) : (
            customItems.map((item, index) => (
              <div key={item.id} className="space-y-6 pb-8 border-b border-[#E4E4E0] last:border-b-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-24 object-cover border border-[#E4E4E0] shrink-0"
                    />
                    <div>
                      <p className="font-mono text-xs text-[#71717A]">
                        GARMENT {index + 1} · SKU {item.sku} · QTY {item.quantity}
                      </p>
                      <h3 className="font-editorial text-2xl font-medium mt-0.5">{item.name}</h3>
                      <p className="text-xs text-[#3F3F46] mt-1">
                        Cut Option: <strong>{item.cutOption}</strong>
                      </p>
                      {item.bespokeSpec?.profileName && (
                        <p className="text-xs text-[#1B365D] mt-0.5">
                          Measurement Profile: {item.bespokeSpec.profileName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fabric Swatch Card */}
                  <div className="flex items-center gap-3 p-3 border border-[#E4E4E0] bg-[#FAFAFA] shrink-0">
                    <div
                      className="w-12 h-12 border border-black/20 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${item.swatch.hexPrimary} 45%, ${item.swatch.hexSecondary} 45%, ${item.swatch.hexSecondary} 72%, ${item.swatch.hexAccent} 72%)`,
                      }}
                    />
                    <div className="text-xs">
                      <p className="text-[11px] text-[#71717A]">Fabric Swatch</p>
                      <p className="font-semibold">{item.swatch.name}</p>
                      <p className="text-[#52525B]">{item.swatch.material}</p>
                    </div>
                  </div>
                </div>

                {/* Dual-Unit Measurement Specification Table */}
                {item.bespokeSpec && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2">
                        Verified Body Dimensions (Inches & Centimeters)
                      </p>
                      <table className="w-full text-xs border border-[#D4D4D8] border-collapse">
                        <thead>
                          <tr className="bg-[#F4F4F5] text-left">
                            <th className="p-2.5 border border-[#D4D4D8]">Measurement Point</th>
                            <th className="p-2.5 border border-[#D4D4D8] font-mono">Inches (in)</th>
                            <th className="p-2.5 border border-[#D4D4D8] font-mono">Centimeters (cm)</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono tabular-nums">
                          {(
                            [
                              ['Chest / Bust', item.bespokeSpec.measurementsIn.chestBust],
                              ['Natural Waist', item.bespokeSpec.measurementsIn.waist],
                              ['Hips / Seat', item.bespokeSpec.measurementsIn.hips],
                              ['Shoulder Width', item.bespokeSpec.measurementsIn.shoulderWidth],
                              ['Sleeve Length', item.bespokeSpec.measurementsIn.sleeveLength],
                              ['Neck Circumference', item.bespokeSpec.measurementsIn.neck],
                              ['Trouser Inseam', item.bespokeSpec.measurementsIn.trouserInseam],
                              ['Trouser Outseam', item.bespokeSpec.measurementsIn.trouserOutseam],
                              ['Desired Garment Length', item.bespokeSpec.measurementsIn.garmentLength],
                            ] as const
                          ).map(([label, val]) => (
                            <tr key={label}>
                              <td className="p-2 border border-[#E4E4E0] font-sans font-medium">
                                {label}
                              </td>
                              <td className="p-2 border border-[#E4E4E0]">{val.toFixed(1)}&quot;</td>
                              <td className="p-2 border border-[#E4E4E0]">{inToCm(val).toFixed(1)} cm</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:col-span-4 space-y-4">
                      <div className="p-4 border border-[#D4D4D8] bg-[#FAFAFA]">
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2">
                          Tailor Fit & Embroidery Notes
                        </p>
                        <p className="text-xs text-[#27272A] leading-relaxed">
                          {item.bespokeSpec.fitNotes || 'Standard Josy Textile architectural ease applied.'}
                        </p>
                      </div>

                      {item.bespokeSpec.referencePhotoDataUrl && (
                        <div className="p-3 border border-[#D4D4D8]">
                          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2">
                            Client Style Reference
                          </p>
                          <img
                            src={item.bespokeSpec.referencePhotoDataUrl}
                            alt="Client style reference"
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Atelier QC Sign-Off Block */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#111113] text-xs">
            <div className="space-y-6">
              <p className="font-semibold">1. Master Cutter Sign-Off</p>
              <div className="border-b border-[#A1A1AA]" />
            </div>
            <div className="space-y-6">
              <p className="font-semibold">2. Sewing & Embroidery Lead</p>
              <div className="border-b border-[#A1A1AA]" />
            </div>
            <div className="space-y-6">
              <p className="font-semibold">3. Final 18-Point QC Approval</p>
              <div className="border-b border-[#A1A1AA]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
