import { PriceUnit } from '../types';

export const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Agadir',
  'Tanger',
  'Fès',
  'Meknès',
  'Oujda',
  'Kénitra',
  'El Jadida',
  'Safi',
  'Tétouan',
  'Nador',
  'Mohammedia',
  'Beni Mellal',
] as const;

export const KNOWN_MOROCCAN_STORES = [
  'Marjane',
  'Carrefour',
  'Aswak Assalam',
  'BIM',
  'Acima',
  'Carrefour Market',
  'Atacadão',
  'Épicerie de quartier (Hanout)',
  'Autre magasin',
] as const;

export interface UnitOption {
  value: PriceUnit;
  label: string;
  category: 'mass' | 'volume' | 'count';
  baseUnit: 'kg' | 'L' | 'unite';
  conversionToBase: number; // multiply quantity by this to get base unit
}

export const UNIT_OPTIONS: UnitOption[] = [
  { value: 'g', label: 'Gramme (g)', category: 'mass', baseUnit: 'kg', conversionToBase: 0.001 },
  { value: 'kg', label: 'Kilogramme (kg)', category: 'mass', baseUnit: 'kg', conversionToBase: 1 },
  { value: 'ml', label: 'Millilitre (ml)', category: 'volume', baseUnit: 'L', conversionToBase: 0.001 },
  { value: 'L', label: 'Litre (L)', category: 'volume', baseUnit: 'L', conversionToBase: 1 },
  { value: 'piece', label: 'Pièce', category: 'count', baseUnit: 'unite', conversionToBase: 1 },
  { value: 'unite', label: 'Unité / Lot', category: 'count', baseUnit: 'unite', conversionToBase: 1 },
];
