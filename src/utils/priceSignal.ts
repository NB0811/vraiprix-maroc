import { PriceObservation, PriceSignalResult, FreshnessCategory } from '../types';

/**
 * Centralized Configuration for the VraiPrix evaluation engine.
 * Transparent, verifiable, and easily adjustable.
 */
export const PRICING_ENGINE_CONFIG = {
  // Minimum prior comparable observations required to issue a 🟢🟡🔴 signal
  minObservationsForSignal: 3,

  // Percentage thresholds relative to median reference
  // <= -10% : 🟢 PRIX INTÉRESSANT
  // > -10% and < +10% : 🟡 PRIX DANS LA MOYENNE
  // >= +10% : 🔴 PRIX ÉLEVÉ
  thresholds: {
    interestingMaxPercent: -10, // Exact boundary: -10% is PRIX INTÉRESSANT
    highMinPercent: 10,         // Exact boundary: +10% is PRIX ÉLEVÉ
  },

  // Freshness tiers in days
  freshnessTiers: {
    tresRecentDays: 7,    // 0–7 jours : Très récent
    recentDays: 30,       // 8–30 jours : Récent
    ancienDays: 90,       // 31–90 jours : Ancien
    // > 90 jours : Très ancien
  },

  // Primary reference preferred window: observations within 90 days
  preferredFreshnessDays: 90,

  // Minimum observations in the same city to prioritize city scope
  minObservationsForCityScope: 3,

  // Window to detect obvious duplicate submissions (hours)
  duplicateWindowHours: 24,
} as const;

/**
 * Categorizes an observation date into freshness tier according to project specs:
 * 0–7 jours : Très récent
 * 8–30 jours : Récent
 * 31–90 jours : Ancien
 * Plus de 90 jours : Très ancien
 */
export function getFreshness(dateString: string, nowMs = Date.now()): {
  category: FreshnessCategory;
  label: string;
  weight: number;
  daysDiff: number;
  badgeClass: string;
} {
  const obsDate = new Date(dateString).getTime();
  const diffDays = Math.max(0, Math.floor((nowMs - obsDate) / (1000 * 60 * 60 * 24)));

  if (diffDays <= PRICING_ENGINE_CONFIG.freshnessTiers.tresRecentDays) {
    return {
      category: 'tres_recent',
      label: 'Très récent (0-7j)',
      weight: 1.0,
      daysDiff: diffDays,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  } else if (diffDays <= PRICING_ENGINE_CONFIG.freshnessTiers.recentDays) {
    return {
      category: 'recent',
      label: 'Récent (8-30j)',
      weight: 0.8,
      daysDiff: diffDays,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  } else if (diffDays <= PRICING_ENGINE_CONFIG.freshnessTiers.ancienDays) {
    return {
      category: 'ancien',
      label: 'Ancien (31-90j)',
      weight: 0.5,
      daysDiff: diffDays,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  } else {
    return {
      category: 'tres_ancien',
      label: 'Très ancien (>90j)',
      weight: 0.2,
      daysDiff: diffDays,
      badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
    };
  }
}

/**
 * Calculates the statistical MEDIAN of a list of numbers.
 * For odd length: middle value.
 * For even length: average of the two middle values.
 * Extremely robust against single extreme outliers.
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return Math.round(sorted[mid] * 100) / 100;
  }
  const avg = (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(avg * 100) / 100;
}

/**
 * Calculates the arithmetic MEAN of a list of numbers (as secondary information).
 */
export function calculateMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Detects and removes obvious duplicate entries:
 * Same product (barcode or normalized name), same store, same city, same unit price,
 * recorded on the same date or within 24 hours.
 * Only one representative observation per cluster is retained for the statistical pool.
 */
export function deduplicateObservations(observations: PriceObservation[]): PriceObservation[] {
  const unique: PriceObservation[] = [];

  for (const obs of observations) {
    const isDuplicate = unique.some((existing) => {
      // Barcode match or exact name match
      const sameBarcode = Boolean(obs.barcode && existing.barcode && obs.barcode === existing.barcode);
      const sameName = obs.productName.trim().toLowerCase() === existing.productName.trim().toLowerCase();
      if (!sameBarcode && !sameName) return false;

      // Store and city match
      const sameStore = (obs.store || '').trim().toLowerCase() === (existing.store || '').trim().toLowerCase();
      const sameCity = (obs.city || '').trim().toLowerCase() === (existing.city || '').trim().toLowerCase();
      if (!sameStore || !sameCity) return false;

      // Price match (within 0.01 DH)
      const samePrice = Math.abs(obs.unitPrice - existing.unitPrice) < 0.01;
      if (!samePrice) return false;

      // Time proximity check: within 24 hours
      const timeDiffMs = Math.abs(new Date(obs.date).getTime() - new Date(existing.date).getTime());
      const hoursDiff = timeDiffMs / (1000 * 60 * 60);
      return hoursDiff <= PRICING_ENGINE_CONFIG.duplicateWindowHours;
    });

    if (!isDuplicate) {
      unique.push(obs);
    }
  }

  return unique;
}

export interface EvaluateNewPriceParams {
  currentUnitPrice: number;
  baseUnit: 'kg' | 'L' | 'unite';
  productNameOrBarcode: string;
  priorObservations: PriceObservation[]; // Strictly anterior observations!
  city?: string;
  store?: string;
  evaluatedRawPrice?: number; // e.g. 40 DH (for display)
  evaluatedObservationId?: string; // ID to exclude if accidentally present in priorObservations
  nowMs?: number; // For test predictability
}

/**
 * Evaluates a new price according to the 5-step strict protocol:
 * 1. Collect ONLY prior relevant observations for this product with compatible baseUnit.
 * 2. Calculate reference (median) STRICTLY from these prior observations (without the new price).
 * 3. Compare the new price to this reference.
 * 4. Return the detailed, transparent result for user display.
 * 5. (Caller saves to history AFTER evaluation).
 */
export function evaluateNewPrice(params: EvaluateNewPriceParams): PriceSignalResult {
  const {
    currentUnitPrice,
    baseUnit,
    productNameOrBarcode,
    priorObservations,
    city,
    evaluatedRawPrice,
    evaluatedObservationId,
    nowMs = Date.now(),
  } = params;

  // 1. Filter out the evaluated observation itself if it happened to be in the array
  const cleanKey = (productNameOrBarcode || '').trim().toLowerCase();

  const rawCandidateObs = priorObservations.filter((obs) => {
    // Exclude by ID if matching evaluated observation
    if (evaluatedObservationId && obs.id === evaluatedObservationId) {
      return false;
    }

    // Must match barcode OR name
    const matchBarcode = obs.barcode && obs.barcode.toLowerCase() === cleanKey;
    const matchName =
      cleanKey.length > 0 &&
      (obs.productName.toLowerCase().includes(cleanKey) ||
        cleanKey.includes(obs.productName.toLowerCase()));

    if (!matchBarcode && !matchName) return false;

    // STRICT COMPATIBILITY: Base units must be identical (kg with kg, L with L, unite with unite)
    // Never mix incompatible units (e.g. kg and L)!
    if (obs.baseUnit !== baseUnit) return false;

    // Must have a valid positive unit price
    if (!obs.unitPrice || obs.unitPrice <= 0) return false;

    return true;
  });

  // 2. Remove obvious spam/duplicate contributions so they don't skew the median
  const dedupedObs = deduplicateObservations(rawCandidateObs);

  // 3. Count freshness across all valid candidates
  const freshnessCount = {
    tresRecent: 0,
    recent: 0,
    ancien: 0,
    tresAncien: 0,
  };

  dedupedObs.forEach((obs) => {
    const f = getFreshness(obs.date, nowMs);
    if (f.category === 'tres_recent') freshnessCount.tresRecent++;
    else if (f.category === 'recent') freshnessCount.recent++;
    else if (f.category === 'ancien') freshnessCount.ancien++;
    else freshnessCount.tresAncien++;
  });

  // 4. Geographic scope selection:
  // If city specified and we have >= 3 observations in that city, prioritize same city!
  let scopeLabel = 'Comparé aux prix observés au Maroc';
  let scopedObs = dedupedObs;

  if (city && city.trim()) {
    const cityClean = city.trim().toLowerCase();
    const cityMatches = dedupedObs.filter(
      (o) => (o.city || '').trim().toLowerCase() === cityClean
    );
    if (cityMatches.length >= PRICING_ENGINE_CONFIG.minObservationsForCityScope) {
      scopedObs = cityMatches;
      scopeLabel = `Comparé aux prix observés à ${city.trim()}`;
    }
  }

  // 5. Freshness window prioritization:
  // Prefer observations within 90 days. If < 3 in 90 days, use older observations if total >= 3,
  // but clearly flag that reference is based on old data.
  const recentWithin90 = scopedObs.filter((o) => {
    const diffDays = Math.max(0, Math.floor((nowMs - new Date(o.date).getTime()) / (1000 * 60 * 60 * 24)));
    return diffDays <= PRICING_ENGINE_CONFIG.preferredFreshnessDays;
  });

  let finalPool = scopedObs;
  let isOldDataReference = false;

  if (recentWithin90.length >= PRICING_ENGINE_CONFIG.minObservationsForSignal) {
    finalPool = recentWithin90;
    isOldDataReference = false;
  } else if (scopedObs.length >= PRICING_ENGINE_CONFIG.minObservationsForSignal) {
    finalPool = scopedObs;
    isOldDataReference = true;
  } else {
    // If scoped by city has < 3 but national has >= 3:
    if (scopedObs !== dedupedObs && dedupedObs.length >= PRICING_ENGINE_CONFIG.minObservationsForSignal) {
      scopedObs = dedupedObs;
      scopeLabel = 'Comparé aux prix observés au Maroc';
      const nationalWithin90 = dedupedObs.filter((o) => {
        const diffDays = Math.max(0, Math.floor((nowMs - new Date(o.date).getTime()) / (1000 * 60 * 60 * 24)));
        return diffDays <= PRICING_ENGINE_CONFIG.preferredFreshnessDays;
      });
      if (nationalWithin90.length >= PRICING_ENGINE_CONFIG.minObservationsForSignal) {
        finalPool = nationalWithin90;
        isOldDataReference = false;
      } else {
        finalPool = dedupedObs;
        isOldDataReference = true;
      }
    } else {
      finalPool = scopedObs;
    }
  }

  // Sort prior observations descending by date (most recent first for UI presentation)
  const priorObservationsUsed = [...finalPool].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const observationCount = priorObservationsUsed.length;

  // 6. Minimum observations check:
  // < 3 observations => ⚪ DONNÉES INSUFFISANTES
  if (observationCount < PRICING_ENGINE_CONFIG.minObservationsForSignal || currentUnitPrice <= 0) {
    let description = '';
    if (observationCount === 0) {
      description = 'Aucune observation antérieure enregistrée pour ce produit.';
    } else if (observationCount === 1) {
      description = `1 seule observation antérieure (${priorObservationsUsed[0].unitPrice.toFixed(2)} DH/${baseUnit}) : données insuffisantes pour établir un signal fiable (minimum 3 requis).`;
    } else {
      description = `2 observations antérieures disponibles (${priorObservationsUsed.map(o => `${o.unitPrice.toFixed(2)} DH`).join(', ')}) : données insuffisantes pour un signal fiable (minimum 3 requis).`;
    }

    return {
      level: 'insufficient',
      title: 'DONNÉES INSUFFISANTES',
      description,
      badgeColor: 'text-stone-700 bg-stone-100 border-stone-300',
      textColor: 'text-stone-700',
      bgColor: 'bg-stone-50',
      borderColor: 'border-stone-200',
      iconName: 'help-circle',
      observationCount,
      referenceType: 'median',
      currentUnitPrice,
      evaluatedRawPrice,
      baseUnit,
      scopeLabel,
      isOldDataReference: false,
      priorObservationsUsed,
      freshnessCount,
    };
  }

  // 7. Calculate Statistical Reference: MEDIAN
  const unitPrices = priorObservationsUsed.map((o) => o.unitPrice);
  const referenceUnitPrice = calculateMedian(unitPrices);
  const referenceMeanUnitPrice = calculateMean(unitPrices);

  const minObservedPrice = Math.min(...unitPrices);
  const maxObservedPrice = Math.max(...unitPrices);

  // 8. Calculate exact percentage difference
  // percentDiff = Math.round(((currentUnitPrice - referenceUnitPrice) / referenceUnitPrice) * 100)
  const percentDiff = Math.round(((currentUnitPrice - referenceUnitPrice) / referenceUnitPrice) * 100);

  // 9. Signal classification with explicit boundary definitions:
  // percentDiff <= -10% : 🟢 PRIX INTÉRESSANT
  // percentDiff >= +10% : 🔴 PRIX ÉLEVÉ
  // -10% < percentDiff < +10% : 🟡 PRIX DANS LA MOYENNE
  if (percentDiff <= PRICING_ENGINE_CONFIG.thresholds.interestingMaxPercent) {
    const discountAmount = Math.abs(percentDiff);
    return {
      level: 'interesting',
      title: 'PRIX INTÉRESSANT',
      description: `-${discountAmount} % par rapport au prix de référence (${referenceUnitPrice.toFixed(2)} DH/${baseUnit}).`,
      badgeColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
      textColor: 'text-emerald-800',
      bgColor: 'bg-emerald-50/80',
      borderColor: 'border-emerald-200',
      iconName: 'check-circle',
      observationCount,
      referenceUnitPrice,
      referenceMeanUnitPrice,
      referenceType: 'median',
      currentUnitPrice,
      evaluatedRawPrice,
      baseUnit,
      percentDiff,
      minObservedPrice,
      maxObservedPrice,
      scopeLabel,
      isOldDataReference,
      priorObservationsUsed,
      freshnessCount,
    };
  } else if (percentDiff >= PRICING_ENGINE_CONFIG.thresholds.highMinPercent) {
    return {
      level: 'high',
      title: 'PRIX ÉLEVÉ',
      description: `+${percentDiff} % par rapport au prix de référence (${referenceUnitPrice.toFixed(2)} DH/${baseUnit}).`,
      badgeColor: 'text-rose-800 bg-rose-100 border-rose-300',
      textColor: 'text-rose-800',
      bgColor: 'bg-rose-50/80',
      borderColor: 'border-rose-200',
      iconName: 'alert-triangle',
      observationCount,
      referenceUnitPrice,
      referenceMeanUnitPrice,
      referenceType: 'median',
      currentUnitPrice,
      evaluatedRawPrice,
      baseUnit,
      percentDiff,
      minObservedPrice,
      maxObservedPrice,
      scopeLabel,
      isOldDataReference,
      priorObservationsUsed,
      freshnessCount,
    };
  } else {
    return {
      level: 'average',
      title: 'PRIX DANS LA MOYENNE',
      description: `${percentDiff >= 0 ? '+' : ''}${percentDiff} % par rapport au prix de référence (${referenceUnitPrice.toFixed(2)} DH/${baseUnit}).`,
      badgeColor: 'text-amber-800 bg-amber-100 border-amber-300',
      textColor: 'text-amber-800',
      bgColor: 'bg-amber-50/80',
      borderColor: 'border-amber-200',
      iconName: 'minus-circle',
      observationCount,
      referenceUnitPrice,
      referenceMeanUnitPrice,
      referenceType: 'median',
      currentUnitPrice,
      evaluatedRawPrice,
      baseUnit,
      percentDiff,
      minObservedPrice,
      maxObservedPrice,
      scopeLabel,
      isOldDataReference,
      priorObservationsUsed,
      freshnessCount,
    };
  }
}

export interface EvaluateSignalParams {
  currentUnitPrice: number;
  baseUnit: 'kg' | 'L' | 'unite';
  productNameOrBarcode: string;
  observations: PriceObservation[];
  city?: string;
  store?: string;
  evaluatedObservationId?: string;
  evaluatedRawPrice?: number;
}

/**
 * Backward-compatible evaluation function.
 * Wraps evaluateNewPrice, ensuring clean separation between the evaluated price
 * and prior reference observations.
 */
export function evaluatePriceSignal(params: EvaluateSignalParams): PriceSignalResult {
  return evaluateNewPrice({
    currentUnitPrice: params.currentUnitPrice,
    baseUnit: params.baseUnit,
    productNameOrBarcode: params.productNameOrBarcode,
    priorObservations: params.observations,
    city: params.city,
    store: params.store,
    evaluatedObservationId: params.evaluatedObservationId,
    evaluatedRawPrice: params.evaluatedRawPrice,
  });
}
