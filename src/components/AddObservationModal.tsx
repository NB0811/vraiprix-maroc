import React, { useState } from 'react';
import { PriceObservation, PriceUnit } from '../types';
import { MOROCCAN_CITIES, KNOWN_MOROCCAN_STORES, UNIT_OPTIONS } from '../data/moroccoData';
import { calculateCompletePrice } from '../utils/calculations';
import { X, Camera, Store, MapPin, Tag, Check, AlertCircle } from 'lucide-react';
import { formatDH } from '../utils/formatters';

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (obs: PriceObservation) => void;
  initialData?: Partial<PriceObservation>;
  defaultCity?: string;
  defaultStore?: string;
}

export const AddObservationModal: React.FC<AddObservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCity = 'Casablanca',
  defaultStore = 'Marjane',
}) => {
  const [productName, setProductName] = useState(initialData?.productName || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [barcode, setBarcode] = useState(initialData?.barcode || '');
  const [priceStr, setPriceStr] = useState(initialData?.price ? String(initialData.price) : '');
  const [originalPriceStr, setOriginalPriceStr] = useState(
    initialData?.originalPrice ? String(initialData.originalPrice) : ''
  );
  const [quantityStr, setQuantityStr] = useState(
    initialData?.quantity ? String(initialData.quantity) : '1'
  );
  const [unit, setUnit] = useState<PriceUnit>(initialData?.unit || 'kg');
  const [city, setCity] = useState(initialData?.city || defaultCity);
  const [customCity, setCustomCity] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);

  const [store, setStore] = useState(initialData?.store || defaultStore);
  const [customStore, setCustomStore] = useState('');
  const [isCustomStore, setIsCustomStore] = useState(false);

  const [date, setDate] = useState(
    initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialData?.photoUrl);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if initialData changes when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialData?.productName) setProductName(initialData.productName);
      if (initialData?.brand) setBrand(initialData.brand);
      if (initialData?.barcode) setBarcode(initialData.barcode);
      if (initialData?.price) setPriceStr(String(initialData.price));
      if (initialData?.quantity) setQuantityStr(String(initialData.quantity));
      if (initialData?.unit) setUnit(initialData.unit);
      if (initialData?.city) setCity(initialData.city);
      if (initialData?.store) setStore(initialData.store);
      setErrorMsg(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const numPrice = parseFloat(priceStr.replace(',', '.')) || 0;
  const numQuantity = parseFloat(quantityStr.replace(',', '.')) || 0;
  const numOriginalPrice = parseFloat(originalPriceStr.replace(',', '.')) || 0;

  const priceCalc = calculateCompletePrice(
    numPrice,
    numQuantity,
    unit,
    numOriginalPrice > numPrice ? 'amount' : undefined,
    numOriginalPrice > numPrice ? numOriginalPrice - numPrice : undefined
  );

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Resize and compress on client to avoid large base64 strings
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = (h * maxDim) / w;
          w = maxDim;
        } else if (h > maxDim) {
          w = (w * maxDim) / h;
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setPhotoUrl(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setErrorMsg('Veuillez renseigner le nom du produit.');
      return;
    }
    if (numPrice <= 0) {
      setErrorMsg('Veuillez renseigner un prix valide supérieur à 0 DH.');
      return;
    }
    if (numQuantity <= 0) {
      setErrorMsg('Veuillez renseigner une quantité supérieure à 0.');
      return;
    }

    const finalCity = isCustomCity ? customCity.trim() || 'Autre ville' : city;
    const finalStore = isCustomStore ? customStore.trim() || 'Autre magasin' : store;

    const newObservation: PriceObservation = {
      id: initialData?.id || `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      barcode: barcode.trim() || undefined,
      productName: productName.trim(),
      brand: brand.trim() || undefined,
      price: numPrice,
      originalPrice: numOriginalPrice > numPrice ? numOriginalPrice : undefined,
      quantity: numQuantity,
      unit,
      unitPrice: priceCalc.unitPrice,
      baseUnit: priceCalc.baseUnit,
      store: finalStore,
      city: finalCity,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
      photoUrl,
      syncStatus: 'local_only',
      verifiedCount: 1,
    };

    onSave(newObservation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#006233] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900">
              {initialData?.id ? "Modifier l'observation" : 'Enregistrer une observation'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nom du produit <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Huile d'olive extra vierge, Lait UHT, Farine..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006233] focus:bg-white"
            />
          </div>

          {/* Brand & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Marque (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Lesieur, Centrale..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006233] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Code-barres EAN
              </label>
              <input
                type="text"
                placeholder="Ex: 6111234567890"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#006233] focus:bg-white"
              />
            </div>
          </div>

          {/* Price & Quantity & Unit */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Prix payé (DH) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    placeholder="0.00"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-base font-bold text-stone-900 pr-10 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-stone-500">
                    DH
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Prix barré (si promo)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    placeholder="Prix initial"
                    value={originalPriceStr}
                    onChange={(e) => setOriginalPriceStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm text-stone-700 pr-10 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-stone-400">
                    DH
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Quantité / Poids <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Ex: 1, 0.5, 250..."
                  value={quantityStr}
                  onChange={(e) => setQuantityStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Unité de mesure <span className="text-rose-600">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as PriceUnit)}
                  className="w-full px-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Calculated Unit Price Preview */}
            {priceCalc.unitPrice > 0 && (
              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-medium">Prix unitaire calculé :</span>
                <span className="font-extrabold text-[#006233] text-sm">
                  {formatDH(priceCalc.unitPrice)} / {priceCalc.baseUnit}
                </span>
              </div>
            )}
          </div>

          {/* City & Store */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#006233]" />
                <span>Ville</span>
              </label>
              {!isCustomCity ? (
                <div className="space-y-1">
                  <select
                    value={city}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCity(true);
                      } else {
                        setCity(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                  >
                    {MOROCCAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">+ Autre ville...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Nom de la ville"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCity(false)}
                    className="px-2 text-xs text-stone-500"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#006233]" />
                <span>Magasin</span>
              </label>
              {!isCustomStore ? (
                <select
                  value={store}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomStore(true);
                    } else {
                      setStore(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#006233]"
                >
                  {KNOWN_MOROCCAN_STORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__custom__">+ Saisir un magasin...</option>
                </select>
              ) : (
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Nom du magasin"
                    value={customStore}
                    onChange={(e) => setCustomStore(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomStore(false)}
                    className="px-2 text-xs text-stone-500"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Date d'observation
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#006233]"
            />
          </div>

          {/* Photo optionnelle */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Photo du prix ou du ticket (optionnel)
            </label>
            {photoUrl ? (
              <div className="relative inline-block mt-1">
                <img
                  src={photoUrl}
                  alt="Preuve prix"
                  className="w-24 h-24 object-cover rounded-xl border border-stone-200"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center shadow-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-stone-300 rounded-xl text-xs font-medium text-stone-600 hover:border-[#006233] hover:text-[#006233] cursor-pointer transition">
                <Camera className="w-4 h-4" />
                <span>Prendre en photo l'étiquette ou le ticket</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#006233] hover:bg-[#004d27] active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer dans mon historique</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
