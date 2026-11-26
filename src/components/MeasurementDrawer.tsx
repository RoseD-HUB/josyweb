import React, { useEffect, useState } from 'react';
import { Check, Ruler, Upload, X } from 'lucide-react';
import {
  BespokeSpec,
  BodyMeasurements,
  MeasurementProfile,
  MeasurementUnit,
} from '../types/josy';
import { cmToIn, inToCm } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { validateMeasurementsOnServer } from '../lib/api';

type MeasurementKey = keyof BodyMeasurements;

interface FieldSpec {
  key: MeasurementKey;
  label: string;
  hint: string;
  minIn: number;
  maxIn: number;
  guideLine: { x1: number; y1: number; x2: number; y2: number };
}

const MEASUREMENT_FIELDS: FieldSpec[] = [
  {
    key: 'neck',
    label: 'Neck Circumference',
    hint: 'Wrap tape around base of neck with one finger of ease.',
    minIn: 12,
    maxIn: 24,
    guideLine: { x1: 92, y1: 66, x2: 128, y2: 66 },
  },
  {
    key: 'shoulderWidth',
    label: 'Shoulder Width',
    hint: 'Measure straight across upper back from shoulder bone to shoulder bone.',
    minIn: 14,
    maxIn: 26,
    guideLine: { x1: 58, y1: 84, x2: 162, y2: 84 },
  },
  {
    key: 'chestBust',
    label: 'Chest / Bust',
    hint: 'Measure around fullest part of chest/bust keeping tape horizontal.',
    minIn: 28,
    maxIn: 64,
    guideLine: { x1: 68, y1: 118, x2: 152, y2: 118 },
  },
  {
    key: 'waist',
    label: 'Natural Waist',
    hint: 'Measure around narrowest part of torso above the navel.',
    minIn: 24,
    maxIn: 60,
    guideLine: { x1: 75, y1: 158, x2: 145, y2: 158 },
  },
  {
    key: 'hips',
    label: 'Hips / Seat',
    hint: 'Measure around fullest part of hips with heels together.',
    minIn: 30,
    maxIn: 68,
    guideLine: { x1: 66, y1: 196, x2: 154, y2: 196 },
  },
  {
    key: 'sleeveLength',
    label: 'Sleeve Length',
    hint: 'From outer shoulder seam down slightly bent elbow to wrist bone.',
    minIn: 18,
    maxIn: 34,
    guideLine: { x1: 162, y1: 86, x2: 184, y2: 188 },
  },
  {
    key: 'garmentLength',
    label: 'Desired Garment Length',
    hint: 'From high shoulder point near neck straight down to preferred hem.',
    minIn: 24,
    maxIn: 62,
    guideLine: { x1: 110, y1: 72, x2: 110, y2: 245 },
  },
  {
    key: 'trouserOutseam',
    label: 'Trouser Outseam',
    hint: 'From waistband side straight down outer leg to shoe top.',
    minIn: 32,
    maxIn: 52,
    guideLine: { x1: 150, y1: 164, x2: 154, y2: 318 },
  },
  {
    key: 'trouserInseam',
    label: 'Trouser Inseam',
    hint: 'From crotch seam straight down inner leg to ankle hem.',
    minIn: 24,
    maxIn: 40,
    guideLine: { x1: 110, y1: 214, x2: 110, y2: 318 },
  },
];

const DEFAULT_MEASUREMENTS_IN: BodyMeasurements = {
  chestBust: 41.0,
  waist: 34.0,
  hips: 40.5,
  shoulderWidth: 18.5,
  sleeveLength: 25.0,
  neck: 16.0,
  trouserInseam: 31.5,
  trouserOutseam: 42.0,
  garmentLength: 32.0,
};

interface MeasurementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  submitLabel?: string;
  initialProfile?: MeasurementProfile | null;
  defaultSaveProfile?: boolean;
  onConfirm: (spec: BespokeSpec) => void;
}

export function MeasurementDrawer({
  isOpen,
  onClose,
  title = 'Guided Custom Measurement Engine',
  submitLabel = 'Confirm Measurements & Continue',
  initialProfile = null,
  defaultSaveProfile = false,
  onConfirm,
}: MeasurementDrawerProps) {
  const { measurementProfiles, saveMeasurementProfile, user, showToast } = useStore();

  const [unit, setUnit] = useState<MeasurementUnit>(initialProfile?.unit || 'in');
  const [measurementsIn, setMeasurementsIn] = useState<BodyMeasurements>(
    initialProfile?.measurements || DEFAULT_MEASUREMENTS_IN
  );
  const [activeField, setActiveField] = useState<MeasurementKey>('chestBust');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfile?.id || '');
  const [saveProfileChecked, setSaveProfileChecked] = useState(defaultSaveProfile);
  const [newProfileName, setNewProfileName] = useState(initialProfile?.name || '');
  const [fitNotes, setFitNotes] = useState(initialProfile?.notes || '');
  const [referencePhotoDataUrl, setReferencePhotoDataUrl] = useState<string | undefined>(undefined);
  const [referencePhotoName, setReferencePhotoName] = useState<string | undefined>(undefined);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setUnit(initialProfile?.unit || 'in');
    setMeasurementsIn(initialProfile?.measurements || DEFAULT_MEASUREMENTS_IN);
    setSelectedProfileId(initialProfile?.id || '');
    setSaveProfileChecked(defaultSaveProfile || Boolean(initialProfile));
    setNewProfileName(initialProfile?.name || '');
    setFitNotes(initialProfile?.notes || '');
    setReferencePhotoDataUrl(undefined);
    setReferencePhotoName(undefined);
  }, [isOpen, initialProfile, defaultSaveProfile]);

  if (!isOpen) return null;

  const activeSpec =
    MEASUREMENT_FIELDS.find((f) => f.key === activeField) || MEASUREMENT_FIELDS[0];

  const handleLoadProfile = (profile: MeasurementProfile) => {
    setSelectedProfileId(profile.id);
    setMeasurementsIn({ ...profile.measurements });
    setFitNotes(profile.notes);
    setNewProfileName(profile.name);
  };

  const handleValueChange = (key: MeasurementKey, rawValue: string) => {
    const num = parseFloat(rawValue);
    if (Number.isNaN(num)) return;
    const inches = unit === 'in' ? num : cmToIn(num);
    setMeasurementsIn((prev) => ({
      ...prev,
      [key]: Math.round(inches * 10) / 10,
    }));
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReferencePhotoDataUrl(reader.result);
        setReferencePhotoName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    setIsSaving(true);
    try {
      if (user) {
        const check = await validateMeasurementsOnServer({
          unit: 'in',
          measurements: measurementsIn,
        });
        if (check && !check.valid) {
          setValidationErrors(check.errors);
          return;
        }
        if (check?.valid) {
          const noteSuffix =
            check.warnings.length > 0 ? ` · Note: ${check.warnings[0]}` : '';
          showToast(
            `Measurements verified (~${check.estimatedFabricYards} yards est.)${noteSuffix}`
          );
        }
      }

      let profileLabel =
        measurementProfiles.find((p) => p.id === selectedProfileId)?.name || undefined;

      if (saveProfileChecked && newProfileName.trim().length >= 2) {
        const saved = await saveMeasurementProfile(
          {
            name: newProfileName.trim(),
            unit,
            measurements: measurementsIn,
            notes: fitNotes.trim(),
          },
          initialProfile?.id
        );
        if (saved) profileLabel = saved.name;
      }

      onConfirm({
        profileName: profileLabel || newProfileName.trim() || 'Custom Session Metrics',
        measurementsIn,
        fitNotes: fitNotes.trim(),
        referencePhotoDataUrl,
        referencePhotoName,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white h-full overflow-y-auto flex flex-col border-l border-[#E4E4E0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E4E4E0] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#71717A]">Isoko Road Tailoring Specification</p>
            <h2 className="font-editorial text-2xl font-medium text-[#111113]">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Unit Toggle */}
            <div className="flex items-center border border-[#E4E4E0] p-0.5 bg-[#F4F4F5]">
              <button
                type="button"
                onClick={() => setUnit('in')}
                className={`px-3 py-1 text-xs font-mono transition-colors cursor-pointer ${
                  unit === 'in' ? 'bg-[#111113] text-white' : 'text-[#52525B] hover:text-[#111113]'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 text-xs font-mono transition-colors cursor-pointer ${
                  unit === 'cm' ? 'bg-[#111113] text-white' : 'text-[#52525B] hover:text-[#111113]'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close measurement drawer"
              className="p-2 text-[#52525B] hover:text-[#111113] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6">
          {/* Saved Measurement Profiles Quick Auto-Fill */}
          {measurementProfiles.length > 0 && (
            <div className="bg-[#F7F7F5] border border-[#E4E4E0] p-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-medium text-[#27272A]">
                  One-Click Saved Measurement Profiles
                </p>
                <span className="text-xs text-[#71717A]">
                  {user ? 'Synced to your account' : 'Sign in to sync across devices'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {measurementProfiles.map((prof) => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => handleLoadProfile(prof)}
                    className={`px-3.5 py-2 text-xs border transition-colors flex items-center gap-2 cursor-pointer ${
                      selectedProfileId === prof.id
                        ? 'bg-[#1B365D] text-white border-[#1B365D]'
                        : 'bg-white text-[#27272A] border-[#D4D4D8] hover:border-[#111113]'
                    }`}
                  >
                    {selectedProfileId === prof.id && <Check className="w-3.5 h-3.5" />}
                    <span>{prof.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Split Body: Left Interactive Line-Art Diagram + Right Numeric Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Line-Art Anatomical Guide */}
            <div className="lg:col-span-5 bg-[#FAFAFA] border border-[#E4E4E0] p-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-xs text-[#71717A] mb-2">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Active Point</span>
                </span>
                <span className="font-mono text-[#1B365D] font-medium">{activeSpec.label}</span>
              </div>

              <svg
                viewBox="0 0 220 350"
                className="w-full max-w-[230px] h-auto my-2"
                aria-label="Tailoring measurement guide diagram"
              >
                {/* Clean Architectural Human Silhouette Line Art */}
                <g fill="none" stroke="#A1A1AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Head & Neck */}
                  <ellipse cx="110" cy="34" rx="17" ry="21" />
                  <path d="M97 53 L95 69 M123 53 L125 69" />
                  {/* Shoulders & Torso */}
                  <path d="M95 69 L58 84 L40 186 L55 190 L69 116 L75 158 L66 196 L69 322 L96 322 L106 218 L114 218 L124 322 L151 322 L154 196 L145 158 L151 116 L165 190 L180 186 L162 84 L125 69" />
                  {/* Subtle Center Seam */}
                  <line x1="110" y1="69" x2="110" y2="214" strokeDasharray="3 4" stroke="#D4D4D8" />
                </g>

                {/* Inactive Reference Lines */}
                {MEASUREMENT_FIELDS.map((field) => (
                  <line
                    key={field.key}
                    x1={field.guideLine.x1}
                    y1={field.guideLine.y1}
                    x2={field.guideLine.x2}
                    y2={field.guideLine.y2}
                    stroke={field.key === activeField ? '#1B365D' : '#E4E4E7'}
                    strokeWidth={field.key === activeField ? 3 : 1}
                    strokeDasharray={field.key === activeField ? 'none' : '2 3'}
                  />
                ))}

                {/* Active Measuring Anchor Points */}
                <circle
                  cx={activeSpec.guideLine.x1}
                  cy={activeSpec.guideLine.y1}
                  r="4.5"
                  fill="#B48436"
                />
                <circle
                  cx={activeSpec.guideLine.x2}
                  cy={activeSpec.guideLine.y2}
                  r="4.5"
                  fill="#B48436"
                />
              </svg>

              <p className="text-xs text-[#52525B] text-center leading-relaxed mt-2">
                {activeSpec.hint}
              </p>
            </div>

            {/* 9 Measurement Inputs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {MEASUREMENT_FIELDS.map((field) => {
                  const displayVal =
                    unit === 'in'
                      ? measurementsIn[field.key]
                      : inToCm(measurementsIn[field.key]);
                  const isFocused = activeField === field.key;
                  return (
                    <label
                      key={field.key}
                      onClick={() => setActiveField(field.key)}
                      className={`block p-3 border transition-colors cursor-pointer ${
                        isFocused
                          ? 'border-[#1B365D] bg-[#F8FAFC]'
                          : 'border-[#E4E4E0] bg-white hover:border-[#A1A1AA]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#27272A]">{field.label}</span>
                        <span className="text-[11px] font-mono text-[#71717A]">{unit}</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        required
                        min={unit === 'in' ? field.minIn : Math.floor(inToCm(field.minIn))}
                        max={unit === 'in' ? field.maxIn : Math.ceil(inToCm(field.maxIn))}
                        value={displayVal}
                        onFocus={() => setActiveField(field.key)}
                        onChange={(e) => handleValueChange(field.key, e.target.value)}
                        className="w-full font-mono text-base font-medium text-[#111113] tabular-nums bg-transparent focus:outline-none"
                      />
                    </label>
                  );
                })}
              </div>

              {/* Fit Notes & Style Reference Photo Upload */}
              <div className="space-y-3 pt-2 border-t border-[#E4E4E0]">
                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1.5">
                    Customization & Fit Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={fitNotes}
                    onChange={(e) => setFitNotes(e.target.value)}
                    placeholder="e.g., Slim-tapered trousers, tonal embroidery on chest pocket, cufflink sleeves..."
                    className="w-full border border-[#D4D4D8] px-3 py-2 text-sm text-[#111113] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#1B365D]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#FAFAFA] border border-[#E4E4E0]">
                  <div className="flex items-center gap-3 min-w-0">
                    {referencePhotoDataUrl ? (
                      <img
                        src={referencePhotoDataUrl}
                        alt="Style reference preview"
                        className="w-12 h-12 object-cover border border-[#E4E4E0] shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#F2F2F0] flex items-center justify-center text-[#71717A] shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#111113]">
                        Style Reference Photo (Optional)
                      </p>
                      <p className="text-[11px] text-[#71717A] truncate">
                        {referencePhotoName || 'Upload embroidery, collar, or silhouette inspiration'}
                      </p>
                    </div>
                  </div>
                  <label className="px-3.5 py-2 border border-[#111113] text-xs font-medium text-[#111113] hover:bg-[#111113] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer text-center">
                    <span>{referencePhotoDataUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Save to Cloud Profiles Option */}
                <div className="p-3.5 border border-[#E4E4E0] bg-white space-y-2.5">
                  <label className="flex items-center gap-2.5 text-xs font-medium text-[#111113] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveProfileChecked}
                      onChange={(e) => setSaveProfileChecked(e.target.checked)}
                      className="accent-[#1B365D] w-4 h-4"
                    />
                    <span>Save these metrics to my Saved Measurement Profiles for repeat orders</span>
                  </label>
                  {saveProfileChecked && (
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder='Profile name (e.g., "My Corporate Suit Fit")'
                      className="w-full border border-[#D4D4D8] px-3 py-2 text-sm text-[#111113] focus:outline-none focus:border-[#1B365D]"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="p-3.5 border border-[#991B1B] bg-[#FEF2F2] text-xs text-[#991B1B] space-y-1">
              <p className="font-semibold">Please check the following measurement bounds:</p>
              {validationErrors.map((err) => (
                <p key={err}>• {err}</p>
              ))}
            </div>
          )}

          {/* Sticky Footer Submit */}
          <div className="pt-4 border-t border-[#E4E4E0] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#71717A]">
              Hand-tailored at Isoko Road, Ughelli · 10–14 business days completion
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-3 border border-[#D4D4D8] text-xs font-medium text-[#27272A] hover:border-[#111113] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#111113] text-white text-xs font-medium tracking-wide hover:bg-[#1B365D] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? 'Saving...' : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
