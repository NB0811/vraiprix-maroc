import React, { useState } from 'react';
import { PriceObservation } from '../types';
import { MOROCCAN_CITIES, KNOWN_MOROCCAN_STORES } from '../data/moroccoData';
import { getFreshness } from '../utils/priceSignal';
import { formatDH, formatDateRelative } from '../utils/formatters';
import {
  History,
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Store,
  Trash2,
  Calendar,
  Image as ImageIcon,
  Tag,
  X,
  Share2,
} from 'lucide-react';

interface HistoryViewProps {
  observations: PriceObservation[];
  onDeleteObservation: (id: string) => void;
  onAddNewObservation: () => void;
  onEditObservation: (obs: PriceObservation) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  observations,
  onDeleteObservation,
  onAddNewObservation,
  onEditObservation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('ALL');
  const [filterStore, setFilterStore] = useState('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | '7d' | '30d' | '90d'>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Apply filters strictly without mock fallback
  const filteredObservations = observations.filter((obs) => {
    // Search by product name, brand or barcode
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = obs.productName.toLowerCase().includes(q);
      const matchBrand = obs.brand?.toLowerCase().includes(q);
      const matchBarcode = obs.barcode?.includes(q);
      if (!matchName && !matchBrand && !matchBarcode) return false;
    }

    // Filter City
    if (filterCity !== 'ALL' && obs.city !== filterCity) {
      return false;
    }

    // Filter Store
    if (filterStore !== 'ALL' && obs.store !== filterStore) {
      return false;
    }

    // Filter Period
    if (filterPeriod !== 'ALL') {
      const now = Date.now();
      const obsTime = new Date(obs.date).getTime();
      const diffDays = Math.floor((now - obsTime) / (1000 * 60 * 60 * 24));

      if (filterPeriod === '7d' && diffDays > 7) return false;
      if (filterPeriod === '30d' && diffDays > 30) return false;
      if (filterPeriod === '90d' && diffDays > 90) return false;
    }

    return true;
  });

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#006233]" />
            <span>Historique des prix</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {observations.length} observation{observations.length > 1 ? 's' : ''} enregistrée
            {observations.length > 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={onAddNewObservation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006233] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#004d27]"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Rechercher par produit, marque ou code-barres..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#006233] shadow-xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Accordion/Bar */}
      <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
        <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtres</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* City filter */}
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
          >
            <option value="ALL">Toutes villes</option>
            {MOROCCAN_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Store filter */}
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
          >
            <option value="ALL">Tous magasins</option>
            {KNOWN_MOROCCAN_STORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Period filter */}
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value as 'ALL' | '7d' | '30d' | '90d')}
            className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
          >
            <option value="ALL">Toute période</option>
            <option value="7d">≤ 7 jours</option>
            <option value="30d">≤ 30 jours</option>
            <option value="90d">≤ 90 jours</option>
          </select>
        </div>
      </div>

      {/* EMPTY STATE */}
      {observations.length === 0 && (
        <div className="p-8 bg-white border border-stone-200 rounded-3xl text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
            <History className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-800">
              Aucun historique pour le moment
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Enregistrez vos premières observations de prix en scannant un produit ou en calculant
              une offre pour bâtir votre comparateur personnel.
            </p>
          </div>
          <button
            onClick={onAddNewObservation}
            className="px-5 py-3 bg-[#006233] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#004d27] inline-flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Enregistrer une observation</span>
          </button>
        </div>
      )}

      {/* NO FILTER RESULTS */}
      {observations.length > 0 && filteredObservations.length === 0 && (
        <div className="p-6 bg-white border border-stone-200 rounded-2xl text-center text-xs text-stone-500">
          Aucune observation ne correspond aux filtres sélectionnés.
        </div>
      )}

      {/* OBSERVATIONS CARDS LIST */}
      <div className="space-y-3">
        {filteredObservations.map((obs) => {
          const freshness = getFreshness(obs.date);

          return (
            <div
              key={obs.id}
              className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs hover:border-stone-300 transition space-y-3"
            >
              {/* Card Top: Product name, brand & freshness */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {obs.brand && (
                    <span className="text-[10px] uppercase font-bold text-[#006233] tracking-wider block">
                      {obs.brand}
                    </span>
                  )}
                  <h3 className="text-sm font-extrabold text-stone-900 leading-snug">
                    {obs.productName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-stone-500">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-stone-700">
                      {obs.quantity} {obs.unit}
                    </span>
                    {obs.barcode && (
                      <span className="font-mono text-[10px] text-stone-400">
                        #{obs.barcode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Freshness Badge */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${freshness.badgeClass}`}
                >
                  {freshness.label}
                </span>
              </div>

              {/* Card Mid: Price & Unit Price */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">
                    Prix payé
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-stone-900">
                      {formatDH(obs.price)}
                    </span>
                    {obs.originalPrice && obs.originalPrice > obs.price && (
                      <span className="text-xs text-stone-400 line-through">
                        {formatDH(obs.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#006233] font-bold uppercase block">
                    Vrai prix unitaire
                  </span>
                  <span className="text-base font-black text-[#006233]">
                    {formatDH(obs.unitPrice)}
                    <span className="text-xs font-semibold text-stone-500 ml-0.5">
                      / {obs.baseUnit}
                    </span>
                  </span>
                </div>
              </div>

              {/* Card Bottom: Metadata (Store, City, Date, Photo) */}
              <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="flex items-center gap-1 text-stone-700 font-semibold">
                    <Store className="w-3.5 h-3.5 text-[#006233]" />
                    <span>{obs.store}</span>
                  </span>

                  <span className="flex items-center gap-1 text-stone-500">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{obs.city}</span>
                  </span>

                  <span className="flex items-center gap-1 text-stone-400 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateRelative(obs.date)}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {obs.photoUrl && (
                    <button
                      onClick={() => setSelectedPhoto(obs.photoUrl!)}
                      title="Voir la photo du ticket / étiquette"
                      className="p-1.5 rounded-lg text-[#006233] bg-emerald-50 hover:bg-emerald-100"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Supprimer l'observation pour "${obs.productName}" ?`)) {
                        onDeleteObservation(obs.id);
                      }
                    }}
                    title="Supprimer"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="relative max-w-sm max-h-[85vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Preuve prix"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
