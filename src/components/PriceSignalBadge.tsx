import React from 'react';
import { PriceSignalResult } from '../types';
import { CheckCircle2, MinusCircle, AlertTriangle, HelpCircle, MapPin, Calendar, Info } from 'lucide-react';
import { formatDH } from '../utils/formatters';

interface PriceSignalBadgeProps {
  signal: PriceSignalResult;
  compact?: boolean;
  showPriorObservationsList?: boolean;
}

export const PriceSignalBadge: React.FC<PriceSignalBadgeProps> = ({
  signal,
  compact = false,
  showPriorObservationsList = true,
}) => {
  const getIcon = (sizeClass = 'w-5 h-5') => {
    switch (signal.level) {
      case 'interesting':
        return <CheckCircle2 className={`${sizeClass} text-emerald-700 shrink-0`} />;
      case 'average':
        return <MinusCircle className={`${sizeClass} text-amber-700 shrink-0`} />;
      case 'high':
        return <AlertTriangle className={`${sizeClass} text-rose-700 shrink-0`} />;
      case 'insufficient':
      default:
        return <HelpCircle className={`${sizeClass} text-stone-600 shrink-0`} />;
    }
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${signal.badgeColor}`}
      >
        {getIcon('w-3.5 h-3.5')}
        <span>{signal.title}</span>
      </div>
    );
  }

  const isInsufficient = signal.level === 'insufficient';
  const hasDiff = signal.percentDiff !== undefined && !isInsufficient;
  const diffSign = (signal.percentDiff ?? 0) > 0 ? '+' : '';

  return (
    <div
      className={`rounded-3xl border p-4 sm:p-5 transition-all duration-200 ${signal.bgColor} ${signal.borderColor} shadow-xs space-y-3.5`}
    >
      {/* Evaluated Price Header (if available) */}
      {signal.evaluatedRawPrice !== undefined && (
        <div className="flex items-baseline justify-between border-b border-stone-200/60 pb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Nouveau prix évalué
          </span>
          <div className="text-right">
            <span className="text-2xl font-black text-stone-900">
              {formatDH(signal.evaluatedRawPrice)}
            </span>
            {signal.baseUnit && signal.currentUnitPrice !== undefined && (
              <span className="block text-[11px] font-semibold text-stone-500">
                ({formatDH(signal.currentUnitPrice)}/{signal.baseUnit})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Signal Banner */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon('w-6 h-6')}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-base font-black tracking-wide uppercase ${signal.textColor}`}>
              {signal.title}
            </span>

            {hasDiff && (
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                  (signal.percentDiff ?? 0) < 0
                    ? 'bg-emerald-200 text-emerald-950'
                    : (signal.percentDiff ?? 0) > 0
                    ? 'bg-rose-200 text-rose-950'
                    : 'bg-amber-200 text-amber-950'
                }`}
              >
                {diffSign}
                {signal.percentDiff}%
              </span>
            )}
          </div>

          {/* Explicit percentage explanation */}
          {hasDiff && signal.referenceUnitPrice !== undefined && (
            <p className="mt-1 text-sm font-bold text-stone-800">
              « {diffSign}
              {signal.percentDiff}% par rapport au prix de référence »
            </p>
          )}

          <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
            {signal.description}
          </p>
        </div>
      </div>

      {/* Statistical Reference Details (Transparent breakdown) */}
      {!isInsufficient && signal.referenceUnitPrice !== undefined && (
        <div className="bg-white/80 rounded-2xl p-3 border border-stone-200/70 space-y-2 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-1.5 bg-stone-50/80 rounded-xl border border-stone-100">
              <span className="block text-[10px] uppercase font-bold text-stone-400">
                Prix de référence
              </span>
              <span className="font-extrabold text-stone-900 text-sm">
                {formatDH(signal.referenceUnitPrice)}
              </span>
              <span className="block text-[9px] text-stone-400 font-medium">Médiane</span>
            </div>

            <div className="p-1.5 bg-stone-50/80 rounded-xl border border-stone-100">
              <span className="block text-[10px] uppercase font-bold text-stone-400">
                Basé sur
              </span>
              <span className="font-extrabold text-stone-900 text-sm">
                {signal.observationCount}
              </span>
              <span className="block text-[9px] text-stone-400 font-medium">
                obs. antérieures
              </span>
            </div>

            <div className="p-1.5 bg-stone-50/80 rounded-xl border border-stone-100">
              <span className="block text-[10px] uppercase font-bold text-stone-400">
                Fourchette observée
              </span>
              <span className="font-extrabold text-stone-900 text-xs mt-0.5 block">
                {signal.minObservedPrice !== undefined && signal.maxObservedPrice !== undefined
                  ? `${signal.minObservedPrice} – ${signal.maxObservedPrice} DH`
                  : '-'}
              </span>
              <span className="block text-[9px] text-stone-400 font-medium">Min – Max</span>
            </div>
          </div>

          {/* Geographic scope and freshness metadata */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-stone-500">
            <div className="flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#006233]" />
              <span>{signal.scopeLabel || 'Comparé aux prix observés au Maroc'}</span>
            </div>

            <div className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              {signal.isOldDataReference ? (
                <span className="text-amber-700 font-semibold">
                  Données anciennes (&gt; 90 jours)
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">Données récentes (≤ 90j)</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prior Observations List (Excluding the new price!) */}
      {showPriorObservationsList &&
        signal.priorObservationsUsed &&
        signal.priorObservationsUsed.length > 0 && (
          <div className="bg-white/90 rounded-2xl p-3 border border-stone-200/80 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800">
                Observations antérieures ayant servi à la référence ({signal.priorObservationsUsed.length}) :
              </span>
              <span className="text-[10px] text-stone-400 italic">
                Nouveau prix non inclus
              </span>
            </div>

            <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
              {signal.priorObservationsUsed.map((obs) => (
                <div
                  key={obs.id}
                  className="py-1.5 flex items-center justify-between text-[11px]"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-stone-800 block truncate">
                      {obs.store || 'Magasin'} — {obs.city}
                    </span>
                    <span className="text-stone-400 text-[10px]">
                      {new Date(obs.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-stone-900 block">
                      {formatDH(obs.price)}
                    </span>
                    {obs.baseUnit && obs.unitPrice > 0 && (
                      <span className="text-[10px] text-stone-500 font-medium">
                        {formatDH(obs.unitPrice)}/{obs.baseUnit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Insufficient data guidance */}
      {isInsufficient && (
        <div className="flex items-start gap-1.5 text-[11px] text-stone-500 bg-stone-100/70 p-2.5 rounded-xl border border-stone-200/60">
          <Info className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
          <span>
            {signal.observationCount === 0
              ? 'Le moteur Vrai Prix a besoin d’au moins 3 observations antérieures comparables pour calculer une médiane représentative.'
              : `${signal.observationCount} observation${
                  signal.observationCount > 1 ? 's' : ''
                } antérieure${signal.observationCount > 1 ? 's' : ''} disponible${
                  signal.observationCount > 1 ? 's' : ''
                }. Le signal 🟢🟡🔴 s’activera dès la 3ème observation comparable.`}
          </span>
        </div>
      )}
    </div>
  );
};
