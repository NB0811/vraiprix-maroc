import React, { useState } from 'react';
import { PriceUnit, ProductInfo, PriceObservation } from '../types';
import { UNIT_OPTIONS } from '../data/moroccoData';
import { calculateCompletePrice } from '../utils/calculations';
import { evaluatePriceSignal } from '../utils/priceSignal';
import { PriceSignalBadge } from './PriceSignalBadge';
import { formatDH } from '../utils/formatters';
import {
  Calculator,
  Percent,
  Coins,
  ArrowRight,
  PlusCircle,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';

interface CalculatorViewProps {
  initialProduct?: ProductInfo | null;
  onSaveAsObservation: (data: {
    productName: string;
    brand?: string;
    barcode?: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    unit: PriceUnit;
  }) => void;
  onSendToCompare: (data: {
    productName: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    unit: PriceUnit;
  }) => void;
  observations: PriceObservation[];
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  initialProduct,
  onSaveAsObservation,
  onSendToCompare,
  observations,
}) => {
  const [productName, setProductName] = useState(initialProduct?.name || '');
  const [brand, setBrand] = useState(initialProduct?.brand || '');
  const [barcode, setBarcode] = useState(initialProduct?.barcode || '');

  const [initialPriceStr, setInitialPriceStr] = useState('60');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValueStr, setDiscountValueStr] = useState('');
  const [quantityStr, setQuantityStr] = useState(
    initialProduct?.quantity ? String(initialProduct.quantity) : '2'
  );
  const [unit, setUnit] = useState<PriceUnit>(initialProduct?.unit || 'kg');

  // React to initialProduct changes
  React.useEffect(() => {
    if (initialProduct) {
      if (initialProduct.name) setProductName(initialProduct.name);
      if (initialProduct.brand) setBrand(initialProduct.brand);
      if (initialProduct.barcode) setBarcode(initialProduct.barcode);
      if (initialProduct.quantity) setQuantityStr(String(initialProduct.quantity));
      if (initialProduct.unit) setUnit(initialProduct.unit);
    }
  }, [initialProduct]);

  const initialPrice = Math.max(0, parseFloat(initialPriceStr.replace(',', '.')) || 0);
  const discountVal = Math.max(0, parseFloat(discountValueStr.replace(',', '.')) || 0);
  const quantity = Math.max(0, parseFloat(quantityStr.replace(',', '.')) || 0);

  const calcResult = calculateCompletePrice(
    initialPrice,
    quantity,
    unit,
    discountVal > 0 ? discountType : undefined,
    discountVal > 0 ? discountVal : undefined
  );

  // Evaluate price signal if we have observations for this product
  const searchName = productName.trim() || barcode.trim();
  const priceSignal =
    searchName && calcResult.unitPrice > 0
      ? evaluatePriceSignal({
          currentUnitPrice: calcResult.unitPrice,
          baseUnit: calcResult.baseUnit,
          productNameOrBarcode: barcode || productName,
          observations,
        })
      : null;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-24 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#006233]" />
          <span>Calculateur de vrai prix</span>
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Calculez la remise réelle et le prix exact au kilo, litre ou à l'unité
        </p>
      </div>

      {/* Product identifier (optional) */}
      <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Produit (facultatif)
          </label>
          <input
            type="text"
            placeholder="Ex: Couscous Fin Dari, Huile d'Argan, Lait..."
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#006233]"
          />
        </div>
      </div>

      {/* Price & Discount Input Card */}
      <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
        {/* Price Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-extrabold text-stone-800">
              Prix initial affiché en magasin
            </label>
            <span className="text-[11px] font-semibold text-stone-400">MAD / DH</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.05"
              min="0"
              placeholder="Ex: 60"
              value={initialPriceStr}
              onChange={(e) => setInitialPriceStr(e.target.value)}
              className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-[#006233] rounded-2xl text-xl font-black text-stone-900 pr-14 focus:outline-none transition"
            />
            <span className="absolute right-4 top-3.5 text-sm font-bold text-stone-400">
              DH
            </span>
          </div>
        </div>

        {/* Reduction / Discount Toggle & Input */}
        <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Promotion / Réduction</span>
            </span>

            {/* Switch between % and DH */}
            <div className="flex bg-amber-200/50 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  discountType === 'percent'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                % Pourcentage
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('amount')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  discountType === 'amount'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                DH Montant
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              step={discountType === 'percent' ? '1' : '0.5'}
              min="0"
              max={discountType === 'percent' ? '100' : initialPrice}
              placeholder={discountType === 'percent' ? 'Ex: 20 (pour -20%)' : 'Ex: 10 (pour -10 DH)'}
              value={discountValueStr}
              onChange={(e) => setDiscountValueStr(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-stone-900 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-amber-800">
              {discountType === 'percent' ? '%' : 'DH'}
            </span>
          </div>

          {/* Quick discount chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {discountType === 'percent' ? (
              <>
                {['10', '20', '30', '50'].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountValueStr(pct)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    -{pct}%
                  </button>
                ))}
              </>
            ) : (
              <>
                {['5', '10', '15', '20'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDiscountValueStr(amt)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    -{amt} DH
                  </button>
                ))}
              </>
            )}
            {discountVal > 0 && (
              <button
                type="button"
                onClick={() => setDiscountValueStr('')}
                className="px-2.5 py-1 rounded-lg bg-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-300"
              >
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Quantity and Unit Card */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-extrabold text-stone-800 mb-1">
              Quantité / Format
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ex: 2"
              value={quantityStr}
              onChange={(e) => setQuantityStr(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border-2 border-stone-200 focus:border-[#006233] rounded-xl text-base font-black text-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-800 mb-1">
              Unité de mesure
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as PriceUnit)}
              className="w-full px-3 py-2.5 bg-stone-50 border-2 border-stone-200 focus:border-[#006233] rounded-xl text-sm font-bold text-stone-900 focus:outline-none"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* RESULT CARDS */}
      <div className="bg-gradient-to-br from-[#006233] to-[#004d27] rounded-3xl p-5 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Résultats réels calculés
          </span>
          {calcResult.discountSaved > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#F3C64F] text-stone-900 text-xs font-black">
              Économie : -{formatDH(calcResult.discountSaved)} ({calcResult.effectiveDiscountPercent}%)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Final Total Price */}
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs border border-white/10">
            <span className="block text-[11px] font-medium text-emerald-100">
              Prix final payé
            </span>
            <span className="text-2xl font-black text-white">
              {formatDH(calcResult.finalPrice)}
            </span>
            {calcResult.discountSaved > 0 && (
              <span className="block text-[10px] text-emerald-200 line-through">
                au lieu de {formatDH(initialPrice)}
              </span>
            )}
          </div>

          {/* Unit Price (Per KG / Per L / Per Unite) */}
          <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-xs border border-[#F3C64F]/30 ring-1 ring-[#F3C64F]/20">
            <span className="block text-[11px] font-bold text-[#F3C64F]">
              VRAI PRIX AU {calcResult.baseUnit.toUpperCase()}
            </span>
            <span className="text-2xl font-black text-white">
              {formatDH(calcResult.unitPrice)}
            </span>
            <span className="block text-[10px] text-emerald-100 font-semibold">
              par {calcResult.baseUnit === 'unite' ? 'pièce/unité' : calcResult.baseUnit}
            </span>
          </div>
        </div>

        {/* Concrete readable sentence */}
        <div className="text-xs text-emerald-50 bg-black/20 rounded-xl p-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>
            Ce produit ({quantity} {unit}) à {formatDH(calcResult.finalPrice)} vous revient exactement à{' '}
            <strong className="text-white underline decoration-[#F3C64F] underline-offset-2">
              {formatDH(calcResult.unitPrice)} / {calcResult.baseUnit}
            </strong>
            .
          </span>
        </div>
      </div>

      {/* Statistical Price Signal badge if observations exist */}
      {priceSignal && (
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block ml-1">
            Analyse comparative statistique
          </span>
          <PriceSignalBadge signal={priceSignal} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() =>
            onSaveAsObservation({
              productName: productName.trim() || `Produit (${quantity} ${unit})`,
              brand: brand.trim() || undefined,
              barcode: barcode.trim() || undefined,
              price: calcResult.finalPrice,
              originalPrice: calcResult.discountSaved > 0 ? initialPrice : undefined,
              quantity,
              unit,
            })
          }
          className="py-3 px-4 bg-[#006233] hover:bg-[#004d27] active:scale-[0.99] text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Enregistrer l'observation</span>
        </button>

        <button
          onClick={() =>
            onSendToCompare({
              productName: productName.trim() || `Produit ${quantity}${unit}`,
              price: calcResult.finalPrice,
              originalPrice: calcResult.discountSaved > 0 ? initialPrice : undefined,
              quantity,
              unit,
            })
          }
          className="py-3 px-4 bg-stone-100 hover:bg-stone-200 active:scale-[0.99] text-stone-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border border-stone-300"
        >
          <Scale className="w-4 h-4 text-[#006233]" />
          <span>Ajouter au comparateur</span>
        </button>
      </div>
    </div>
  );
};
