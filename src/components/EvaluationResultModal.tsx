import React from 'react';
import { PriceSignalResult } from '../types';
import { PriceSignalBadge } from './PriceSignalBadge';
import { X, Check } from 'lucide-react';

interface EvaluationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: PriceSignalResult | null;
  onGoToHistory?: () => void;
}

export const EvaluationResultModal: React.FC<EvaluationResultModalProps> = ({
  isOpen,
  onClose,
  signal,
  onGoToHistory,
}) => {
  if (!isOpen || !signal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div>
            <h3 className="text-base font-black text-stone-900">
              Évaluation du prix
            </h3>
            <p className="text-xs text-stone-500">
              Calculé à partir des observations antérieures
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          <PriceSignalBadge signal={signal} showPriorObservationsList={true} />

          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Prix enregistré avec succès dans votre historique.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-2">
          {onGoToHistory && (
            <button
              onClick={() => {
                onClose();
                onGoToHistory();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition cursor-pointer text-center"
            >
              Voir l’historique
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 bg-[#006233] text-white rounded-xl text-xs font-bold hover:bg-[#004d27] transition cursor-pointer text-center"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};
