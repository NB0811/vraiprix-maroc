export type PriceUnit = 'g' | 'kg' | 'ml' | 'L' | 'unite' | 'piece';

export interface ProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  quantity?: number;
  unit?: PriceUnit;
  category?: string;
  imageUrl?: string;
  source?: 'openfoodfacts' | 'user_manual' | 'local_cache';
}

export type FreshnessCategory = 'tres_recent' | 'recent' | 'ancien' | 'tres_ancien';

export interface PriceObservation {
  id: string;
  barcode?: string;
  productName: string;
  brand?: string;
  price: number; // in MAD / DH
  originalPrice?: number; // before discount
  discountType?: 'percent' | 'amount';
  discountValue?: number;
  quantity: number;
  unit: PriceUnit;
  unitPrice: number; // price per base unit (kg, L, or piece)
  baseUnit: 'kg' | 'L' | 'unite';
  store: string;
  city: string;
  date: string; // ISO string
  notes?: string;
  photoUrl?: string; // base64 or object URL (optional receipt/shelf tag)
  syncStatus?: 'local_only' | 'pending_sync' | 'synced';
  flagCount?: number;
  verifiedCount?: number;
}

export interface ComparisonOffer {
  id: string;
  label: string; // "Offre A", "Offre B", etc.
  store: string;
  city: string;
  price: number;
  originalPrice?: number;
  discountType?: 'percent' | 'amount';
  discountValue?: number;
  quantity: number;
  unit: PriceUnit;
  date: string;
}

export type SignalLevel = 'interesting' | 'average' | 'high' | 'insufficient';

export interface PriceSignalResult {
  level: SignalLevel;
  title: string;
  description: string;
  badgeColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconName: 'check-circle' | 'minus-circle' | 'alert-triangle' | 'help-circle';
  observationCount: number;
  referenceUnitPrice?: number; // Primary reference (Median)
  referenceMeanUnitPrice?: number; // Secondary info (Mean)
  referenceType?: 'median';
  currentUnitPrice?: number; // Evaluated unit price
  evaluatedRawPrice?: number; // Evaluated raw price (e.g. 40 DH)
  baseUnit?: 'kg' | 'L' | 'unite';
  percentDiff?: number;
  minObservedPrice?: number;
  maxObservedPrice?: number;
  scopeLabel?: string; // e.g. "Comparé aux prix observés à Casablanca" or "au Maroc"
  isOldDataReference?: boolean; // True if reference relies on data > 90 days
  priorObservationsUsed?: PriceObservation[]; // Prior observations used to compute reference (excluding the new price!)
  freshnessCount: {
    tresRecent: number;
    recent: number;
    ancien: number;
    tresAncien: number;
  };
}

export interface UserPreferences {
  defaultCity: string;
  defaultStore: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: 'light' | 'system';
  hasSeenOnboarding: boolean;
}

export type ActiveTab = 'home' | 'scanner' | 'calculator' | 'compare' | 'history' | 'settings' | 'privacy';
