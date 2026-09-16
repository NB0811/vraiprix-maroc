import { PriceUnit, ComparisonOffer } from '../types';
import { UNIT_OPTIONS } from '../data/moroccoData';

export interface DiscountCalculationInput {
  initialPrice: number;
  discountType?: 'percent' | 'amount';
  discountValue?: number;
}

export interface UnitPriceCalculationInput {
  price: number;
  quantity: number;
  unit: PriceUnit;
}

export interface CalculatedPriceResult {
  finalPrice: number;
  discountSaved: number;
  effectiveDiscountPercent: number;
  unitPrice: number; // Price per base unit (kg, L, or piece)
  baseUnit: 'kg' | 'L' | 'unite';
  baseQuantity: number;
  formattedUnitPrice: string;
}

/**
 * Calculates the final price taking into account percentage or flat amount discount.
 */
export function calculateDiscount(input: DiscountCalculationInput): {
  finalPrice: number;
  discountSaved: number;
  effectiveDiscountPercent: number;
} {
  const initial = Math.max(0, Number(input.initialPrice) || 0);
  const val = Math.max(0, Number(input.discountValue) || 0);

  if (!input.discountType || val === 0 || initial === 0) {
    return {
      finalPrice: Math.round(initial * 100) / 100,
      discountSaved: 0,
      effectiveDiscountPercent: 0,
    };
  }

  let finalPrice = initial;
  let discountSaved = 0;

  if (input.discountType === 'percent') {
    const clampedPercent = Math.min(100, val);
    discountSaved = (initial * clampedPercent) / 100;
    finalPrice = Math.max(0, initial - discountSaved);
  } else if (input.discountType === 'amount') {
    discountSaved = Math.min(initial, val);
    finalPrice = Math.max(0, initial - discountSaved);
  }

  const effectivePercent = initial > 0 ? (discountSaved / initial) * 100 : 0;

  return {
    finalPrice: Math.round(finalPrice * 100) / 100,
    discountSaved: Math.round(discountSaved * 100) / 100,
    effectiveDiscountPercent: Math.round(effectivePercent * 10) / 10,
  };
}

/**
 * Returns the base unit and conversion multiplier for a given unit.
 */
export function getUnitInfo(unit: PriceUnit) {
  const found = UNIT_OPTIONS.find((u) => u.value === unit);
  if (found) return found;
  return {
    value: unit,
    label: unit,
    category: 'count' as const,
    baseUnit: 'unite' as const,
    conversionToBase: 1,
  };
}

/**
 * Calculates exact unit price per kg, per L, or per unite.
 */
export function calculateUnitPrice(
  price: number,
  quantity: number,
  unit: PriceUnit
): {
  unitPrice: number;
  baseUnit: 'kg' | 'L' | 'unite';
  baseQuantity: number;
  formattedUnitPrice: string;
} {
  const safePrice = Math.max(0, Number(price) || 0);
  const safeQty = Math.max(0, Number(quantity) || 0);
  const unitInfo = getUnitInfo(unit);

  if (safeQty <= 0 || safePrice <= 0) {
    return {
      unitPrice: 0,
      baseUnit: unitInfo.baseUnit,
      baseQuantity: 0,
      formattedUnitPrice: `0.00 DH / ${unitInfo.baseUnit}`,
    };
  }

  const baseQuantity = safeQty * unitInfo.conversionToBase;
  const unitPrice = baseQuantity > 0 ? safePrice / baseQuantity : 0;
  const roundedUnitPrice = Math.round(unitPrice * 100) / 100;

  return {
    unitPrice: roundedUnitPrice,
    baseUnit: unitInfo.baseUnit,
    baseQuantity: Math.round(baseQuantity * 1000) / 1000,
    formattedUnitPrice: `${roundedUnitPrice.toFixed(2)} DH / ${unitInfo.baseUnit}`,
  };
}

/**
 * Full price calculation combining discount and unit price.
 */
export function calculateCompletePrice(
  initialPrice: number,
  quantity: number,
  unit: PriceUnit,
  discountType?: 'percent' | 'amount',
  discountValue?: number
): CalculatedPriceResult {
  const discountResult = calculateDiscount({
    initialPrice,
    discountType,
    discountValue,
  });

  const unitResult = calculateUnitPrice(discountResult.finalPrice, quantity, unit);

  return {
    finalPrice: discountResult.finalPrice,
    discountSaved: discountResult.discountSaved,
    effectiveDiscountPercent: discountResult.effectiveDiscountPercent,
    unitPrice: unitResult.unitPrice,
    baseUnit: unitResult.baseUnit,
    baseQuantity: unitResult.baseQuantity,
    formattedUnitPrice: unitResult.formattedUnitPrice,
  };
}

export interface ComparedOfferResult extends ComparisonOffer {
  finalPrice: number;
  unitPrice: number;
  baseUnit: 'kg' | 'L' | 'unite';
  baseQuantity: number;
  isBest: boolean;
  savingsVsWorstPercent?: number;
  percentDiffVsBest?: number;
}

/**
 * Compares an array of offers and sorts them by unit price.
 */
export function compareOffers(offers: ComparisonOffer[]): {
  rankedOffers: ComparedOfferResult[];
  bestOfferId?: string;
  maxSavingsPercent: number;
  areUnitsCompatible: boolean;
  sharedBaseUnit?: 'kg' | 'L' | 'unite';
} {
  const activeOffers = offers.filter((o) => (o.price > 0 || (o.originalPrice ?? 0) > 0) && o.quantity > 0);

  if (activeOffers.length === 0) {
    return {
      rankedOffers: [],
      maxSavingsPercent: 0,
      areUnitsCompatible: true,
    };
  }

  // Calculate unit prices for all
  const computed = activeOffers.map((offer) => {
    const calc = calculateCompletePrice(
      offer.originalPrice ?? offer.price,
      offer.quantity,
      offer.unit,
      offer.discountType,
      offer.discountValue
    );
    return {
      ...offer,
      finalPrice: calc.finalPrice,
      unitPrice: calc.unitPrice,
      baseUnit: calc.baseUnit,
      baseQuantity: calc.baseQuantity,
      isBest: false,
    };
  });

  // Check unit compatibility (e.g. all kg, or all L)
  const baseUnits = new Set(computed.map((c) => c.baseUnit));
  const areUnitsCompatible = baseUnits.size <= 1;
  const sharedBaseUnit = areUnitsCompatible ? computed[0]?.baseUnit : undefined;

  // Sort ascending by unit price
  computed.sort((a, b) => a.unitPrice - b.unitPrice);

  const bestUnitPrice = computed[0]?.unitPrice ?? 0;
  const worstUnitPrice = computed[computed.length - 1]?.unitPrice ?? 0;

  const maxSavingsPercent =
    worstUnitPrice > 0 && bestUnitPrice > 0
      ? Math.round(((worstUnitPrice - bestUnitPrice) / worstUnitPrice) * 100)
      : 0;

  const rankedOffers: ComparedOfferResult[] = computed.map((offer, idx) => {
    const isBest = idx === 0 && computed.length > 1;
    const percentDiffVsBest =
      bestUnitPrice > 0 && offer.unitPrice > bestUnitPrice
        ? Math.round(((offer.unitPrice - bestUnitPrice) / bestUnitPrice) * 100)
        : 0;

    return {
      ...offer,
      isBest,
      percentDiffVsBest,
    };
  });

  return {
    rankedOffers,
    bestOfferId: rankedOffers[0]?.id,
    maxSavingsPercent,
    areUnitsCompatible,
    sharedBaseUnit,
  };
}
