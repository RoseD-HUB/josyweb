export type RecommendedSize = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

export interface SizeRecommendationResult {
  unit: 'in' | 'cm';
  chestIn: number;
  waistIn: number;
  recommendedRtwSize: RecommendedSize;
  preferCustomTailoring: boolean;
  fitSummary: string;
  estimatedFabricYards: number;
}

const SIZE_CHART_IN: Array<{
  size: RecommendedSize;
  chestMin: number;
  chestMax: number;
  waistMin: number;
  waistMax: number;
}> = [
  { size: 'S', chestMin: 34, chestMax: 37.5, waistMin: 28, waistMax: 31.5 },
  { size: 'M', chestMin: 37.5, chestMax: 40.5, waistMin: 31.5, waistMax: 34.5 },
  { size: 'L', chestMin: 40.5, chestMax: 43.5, waistMin: 34.5, waistMax: 37.5 },
  { size: 'XL', chestMin: 43.5, chestMax: 47, waistMin: 37.5, waistMax: 41 },
  { size: '2XL', chestMin: 47, chestMax: 51, waistMin: 41, waistMax: 45 },
  { size: '3XL', chestMin: 51, chestMax: 56, waistMin: 45, waistMax: 50 },
];

export function recommendRtwOrLuxuryFit(input: {
  chestBust: number;
  waist: number;
  unit: 'in' | 'cm';
}): SizeRecommendationResult | null {
  const factor = input.unit === 'cm' ? 1 / 2.54 : 1;
  const chestIn = Math.round(input.chestBust * factor * 10) / 10;
  const waistIn = Math.round(input.waist * factor * 10) / 10;

  if (
    !Number.isFinite(chestIn) ||
    !Number.isFinite(waistIn) ||
    chestIn < 24 ||
    chestIn > 70 ||
    waistIn < 20 ||
    waistIn > 68
  ) {
    return null;
  }

  let chestIdx = SIZE_CHART_IN.findIndex((row) => chestIn <= row.chestMax);
  if (chestIdx === -1) chestIdx = SIZE_CHART_IN.length - 1;

  let waistIdx = SIZE_CHART_IN.findIndex((row) => waistIn <= row.waistMax);
  if (waistIdx === -1) waistIdx = SIZE_CHART_IN.length - 1;

  const targetIdx = Math.max(chestIdx, waistIdx);
  const recommendedRtwSize = SIZE_CHART_IN[targetIdx].size;

  const outOfStandardRange = chestIn < 34 || chestIn > 56 || waistIn < 28 || waistIn > 50;
  const splitSizeRatio = Math.abs(chestIdx - waistIdx) >= 2;
  const preferCustomTailoring = outOfStandardRange || splitSizeRatio;

  let fitSummary: string;
  if (outOfStandardRange) {
    fitSummary = `Your measurements (${chestIn}" chest / ${waistIn}" waist) fall outside standard RTW blocks. We recommend Luxury Custom Tailoring at our Isoko Road atelier for a balanced silhouette.`;
  } else if (splitSizeRatio) {
    fitSummary = `Your chest (${SIZE_CHART_IN[chestIdx].size}) and waist (${SIZE_CHART_IN[waistIdx].size}) span two size brackets. Size ${recommendedRtwSize} fits RTW, or choose Luxury Custom Tailoring for an exact tapered waist.`;
  } else {
    fitSummary = `Size ${recommendedRtwSize} is your ideal Ready-to-Wear match with 2" structured atelier ease (${chestIn}" chest / ${waistIn}" waist).`;
  }

  let estimatedFabricYards = 4;
  if (chestIn >= 46 || waistIn >= 40) estimatedFabricYards = 5;
  if (chestIn >= 52 || waistIn >= 46) estimatedFabricYards = 6;

  return {
    unit: input.unit,
    chestIn,
    waistIn,
    recommendedRtwSize,
    preferCustomTailoring,
    fitSummary,
    estimatedFabricYards,
  };
}
