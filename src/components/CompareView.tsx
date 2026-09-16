import React, { useState } from 'react';
import { ComparisonOffer, PriceUnit, PriceObservation } from '../types';
import { MOROCCAN_CITIES, KNOWN_MOROCCAN_STORES, UNIT_OPTIONS } from '../data/moroccoData';
import { compareOffers } from '../utils/calculations';
import { formatDH } from '../utils/formatters';
import {
  Scale,
  Trophy,
  Plus,
  Trash2,
  TrendingDown,
  Info,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface CompareViewProps {
  onSaveObservation: (obs: PriceObservation) => void;
  incomingOffer?: {
    productName: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    unit: PriceUnit;
  } | null;
}

export const CompareView: React.FC<CompareViewProps> = ({
  onSaveObservation,
  incomingOffer,
}) => {
  const [productTitle, setProductTitle] = useState('Comparatif produit');
  const [offers, setOffers] = useState<ComparisonOffer[]>([
    {
      id: 'offer_1',
      label: 'Offre A',
      store: 'Marjane',
      city: 'Casablanca',
      price: 60,
      quantity: 2,
      unit: 'kg',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'offer_2',
      label: 'Offre B',
      store: 'BIM',
      city: 'Casablanca',
      price: 45,
      quantity: 1,
      unit: 'kg',
      date: new Date().toISOString().split('T')[0],
    },
    {
      id: 'offer_3',
      label: 'Offre C',
      store: 'Carrefour',
      city: 'Casablanca',
      price: 100,
      quantity: 4,
      unit: 'kg',
      date: new Date().toISOString().split('T')[0],
    },
  ]);

  // Handle incoming offer from Scanner or Calculator
  React.useEffect(() => {
    if (incomingOffer) {
      if (incomingOffer.productName) {
        setProductTitle(incomingOffer.productName);
      }
      setOffers((prev) => {
        if (prev.length >= 4) {
          // Replace last
          const updated = [...prev];
          updated[prev.length - 1] = {
            id: `offer_${Date.now()}`,
            label: `Offre ${String.fromCharCode(65 + prev.length - 1)}`,
            store: 'Marjane',
            city: 'Casablanca',
            price: incomingOffer.price,
            originalPrice: incomingOffer.originalPrice,
            quantity: incomingOffer.quantity,
            unit: incomingOffer.unit,
            date: new Date().toISOString().split('T')[0],
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `offer_${Date.now()}`,
              label: `Offre ${String.fromCharCode(65 + prev.length)}`,
              store: 'Marjane',
              city: 'Casablanca',
              price: incomingOffer.price,
              originalPrice: incomingOffer.originalPrice,
              quantity: incomingOffer.quantity,
              unit: incomingOffer.unit,
              date: new Date().toISOString().split('T')[0],
            },
          ];
        }
      });
    }
  }, [incomingOffer]);

  const { rankedOffers, bestOfferId, maxSavingsPercent, areUnitsCompatible, sharedBaseUnit } =
    compareOffers(offers);

  const bestOffer = rankedOffers.find((o) => o.id === bestOfferId);
  const worstOffer =
    rankedOffers.length > 1 ? rankedOffers[rankedOffers.length - 1] : undefined;

  const handleUpdateOffer = (id: string, updates: Partial<ComparisonOffer>) => {
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const handleAddOffer = () => {
    if (offers.length >= 4) return;
    const nextChar = String.fromCharCode(65 + offers.length);
    const lastOffer = offers[offers.length - 1];

    setOffers((prev) => [
      ...prev,
      {
        id: `offer_${Date.now()}`,
        label: `Offre ${nextChar}`,
        store: KNOWN_MOROCCAN_STORES[prev.length % KNOWN_MOROCCAN_STORES.length],
        city: lastOffer ? lastOffer.city : 'Casablanca',
        price: 0,
        quantity: lastOffer ? lastOffer.quantity : 1,
        unit: lastOffer ? lastOffer.unit : 'kg',
        date: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const handleRemoveOffer = (id: string) => {
    if (offers.length <= 2) return; // Keep at least 2 offers for comparison
    setOffers((prev) =>
      prev
        .filter((o) => o.id !== id)
        .map((o, index) => ({
          ...o,
          label: `Offre ${String.fromCharCode(65 + index)}`,
        }))
    );
  };

  const handleSaveToHistory = (offer: ComparisonOffer, unitPrice: number, baseUnit: 'kg' | 'L' | 'unite') => {
    onSaveObservation({
      id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productName: productTitle,
      price: offer.price,
      originalPrice: offer.originalPrice,
      quantity: offer.quantity,
      unit: offer.unit,
      unitPrice,
      baseUnit,
      store: offer.store,
      city: offer.city,
      date: new Date(offer.date).toISOString(),
      syncStatus: 'local_only',
    });
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-28 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#006233]" />
          <span>Comparer des offres</span>
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Déterminez quelle offre coûte réellement le moins cher par unité
        </p>
      </div>

      {/* Product Title Bar */}
      <div className="p-3 bg-white border border-stone-200 rounded-2xl shadow-xs">
        <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
          Nom du produit comparé
        </label>
        <input
          type="text"
          value={productTitle}
          onChange={(e) => setProductTitle(e.target.value)}
          placeholder="Ex: Riz Basmati, Sucre, Lessive liquide..."
          className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-extrabold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#006233]"
        />
      </div>

      {/* WINNER HIGHLIGHT BANNER */}
      {bestOffer && worstOffer && bestOffer.id !== worstOffer.id && maxSavingsPercent > 0 && (
        <div className="p-4 bg-gradient-to-br from-[#006233] to-[#004d27] rounded-3xl text-white shadow-md space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F3C64F] text-stone-950 font-black text-xs flex items-center gap-1 shadow-xs">
              <Trophy className="w-4 h-4 text-amber-950" />
              <span>Gagnant : {bestOffer.label}</span>
            </span>
            <span className="text-xs font-bold text-emerald-200">
              {bestOffer.store} ({bestOffer.city})
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-white tracking-tight">
                {formatDH(bestOffer.unitPrice)}
              </span>
              <span className="text-xs text-emerald-200 font-semibold ml-1">
                / {bestOffer.baseUnit}
              </span>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-xl bg-white/20 text-[#F3C64F] text-xs font-black">
                -{maxSavingsPercent}% d'économie
              </span>
            </div>
          </div>

          <p className="text-[11px] text-emerald-100/90 leading-relaxed border-t border-white/10 pt-2">
            {bestOffer.label} ({bestOffer.store}) coûte{' '}
            <strong className="text-white">
              {formatDH(bestOffer.unitPrice)}/{bestOffer.baseUnit}
            </strong>
            , soit <strong className="text-[#F3C64F]">{maxSavingsPercent}% moins cher</strong> que{' '}
            {worstOffer.label} ({worstOffer.store} à {formatDH(worstOffer.unitPrice)}/
            {worstOffer.baseUnit}).
          </p>
        </div>
      )}

      {/* Unit compatibility warning */}
      {!areUnitsCompatible && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Attention : les offres comparent des unités différentes (ex: masse vs volume). Les
            prix unitaires sont calculés sur leur propre base respective.
          </span>
        </div>
      )}

      {/* OFFERS CARDS LIST */}
      <div className="space-y-3">
        {offers.map((offer, index) => {
          const ranked = rankedOffers.find((r) => r.id === offer.id);
          const isBest = ranked?.isBest;
          const unitPrice = ranked?.unitPrice || 0;
          const baseUnit = ranked?.baseUnit || 'kg';

          return (
            <div
              key={offer.id}
              className={`rounded-3xl p-4 border transition-all duration-200 bg-white shadow-xs ${
                isBest
                  ? 'border-[#006233] ring-2 ring-emerald-400/30'
                  : 'border-stone-200'
              }`}
            >
              {/* Offer Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      isBest
                        ? 'bg-[#006233] text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {offer.label.split(' ')[1] || String.fromCharCode(65 + index)}
                  </span>
                  <div>
                    <span className="text-xs font-extrabold text-stone-900">
                      {offer.label}
                    </span>
                    {isBest && (
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-100 text-[#006233] text-[10px] font-black uppercase">
                        Vrai prix le plus bas
                      </span>
                    )}
                  </div>
                </div>

                {offers.length > 2 && (
                  <button
                    onClick={() => handleRemoveOffer(offer.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-lg"
                    title="Supprimer cette offre"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Price & Quantity Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Price input */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-0.5">
                    Prix payé (DH)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={offer.price || ''}
                      onChange={(e) =>
                        handleUpdateOffer(offer.id, {
                          price: parseFloat(e.target.value.replace(',', '.')) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 pr-9 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs font-bold text-stone-400">
                      DH
                    </span>
                  </div>
                </div>

                {/* Quantity input */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-0.5">
                    Format / Quantité
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={offer.quantity || ''}
                      onChange={(e) =>
                        handleUpdateOffer(offer.id, {
                          quantity: parseFloat(e.target.value.replace(',', '.')) || 0,
                        })
                      }
                      placeholder="Qté"
                      className="w-16 px-2 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                    />
                    <select
                      value={offer.unit}
                      onChange={(e) =>
                        handleUpdateOffer(offer.id, {
                          unit: e.target.value as PriceUnit,
                        })
                      }
                      className="flex-1 px-1.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Store & City Selectors */}
              <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                    Magasin
                  </label>
                  <select
                    value={offer.store}
                    onChange={(e) => handleUpdateOffer(offer.id, { store: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800"
                  >
                    {KNOWN_MOROCCAN_STORES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                    Ville
                  </label>
                  <select
                    value={offer.city}
                    onChange={(e) => handleUpdateOffer(offer.id, { city: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800"
                  >
                    {MOROCCAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CALCULATED UNIT PRICE FOR THIS OFFER */}
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Vrai prix calculé
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-lg font-black ${
                        isBest ? 'text-[#006233]' : 'text-stone-900'
                      }`}
                    >
                      {unitPrice > 0 ? formatDH(unitPrice) : '0.00 DH'}
                    </span>
                    <span className="text-xs font-semibold text-stone-500">
                      / {baseUnit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ranked?.percentDiffVsBest !== undefined && ranked.percentDiffVsBest > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                      +{ranked.percentDiffVsBest}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveToHistory(offer, unitPrice, baseUnit)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Offer Button (up to 4) */}
      {offers.length < 4 && (
        <button
          onClick={handleAddOffer}
          className="w-full py-3 border-2 border-dashed border-stone-300 hover:border-[#006233] text-stone-600 hover:text-[#006233] rounded-3xl text-xs font-bold flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une offre à comparer ({offers.length}/4)</span>
        </button>
      )}
    </div>
  );
};
