import React from 'react';
import { ActiveTab, PriceObservation } from '../types';
import { ZelligePattern } from './ZelligePattern';
import {
  Camera,
  Calculator,
  Scale,
  History,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MinusCircle,
  AlertTriangle,
  HelpCircle,
  Store,
} from 'lucide-react';
import { formatDH } from '../utils/formatters';

interface HomeViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenScanner?: () => void;
  recentObservations: PriceObservation[];
  onAddNewObservation: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  setActiveTab,
  onOpenScanner,
  recentObservations,
  onAddNewObservation,
}) => {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] pb-24 overflow-hidden animate-fade-in">
      {/* Subtle Moroccan zellige architectural backdrop */}
      <ZelligePattern opacity={0.035} />

      <div className="relative max-w-md mx-auto px-4 py-5 space-y-6">
        {/* HERO SECTION */}
        <div className="text-center pt-2 pb-1 space-y-3">
          {/* Moroccan Flag & Brand Emblem */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#006233] text-xs font-bold shadow-2xs">
            <span>🇲🇦</span>
            <span>Le comparateur indépendant au Maroc</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-stone-900 leading-tight">
            VraiPrix <span className="text-[#006233]">Maroc</span>
          </h1>

          <p className="text-sm font-semibold text-stone-600 max-w-xs mx-auto leading-relaxed">
            « Avant d’acheter, connais le vrai prix. »
          </p>
        </div>

        {/* 3 PRIMARY HERO BUTTONS (Requested by user) */}
        <div className="space-y-3">
          {/* 1. SCANNER UN PRODUIT */}
          <button
            id="hero-btn-scan"
            onClick={() => (onOpenScanner ? onOpenScanner() : setActiveTab('scanner'))}
            className="w-full p-4 rounded-3xl bg-gradient-to-r from-[#006233] to-[#004d27] text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-between group border border-emerald-800/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition">
                <Camera className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black tracking-wide uppercase text-white">
                  Scanner un produit
                </span>
                <span className="block text-xs text-emerald-100 font-medium">
                  Caméra mobile, EAN-13 & Open Food Facts
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition" />
          </button>

          {/* 2. CALCULER UN PRIX */}
          <button
            id="hero-btn-calc"
            onClick={() => setActiveTab('calculator')}
            className="w-full p-4 rounded-3xl bg-white border-2 border-stone-200 hover:border-[#006233] text-stone-900 shadow-xs hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Calculator className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black tracking-wide uppercase text-stone-900">
                  Calculer un prix
                </span>
                <span className="block text-xs text-stone-500 font-medium">
                  Remise réelle, prix au kg / litre / unité
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-[#006233] group-hover:translate-x-1 transition" />
          </button>

          {/* 3. COMPARER DES OFFRES */}
          <button
            id="hero-btn-compare"
            onClick={() => setActiveTab('compare')}
            className="w-full p-4 rounded-3xl bg-white border-2 border-stone-200 hover:border-[#006233] text-stone-900 shadow-xs hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C1272D]/10 text-[#C1272D] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Scale className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black tracking-wide uppercase text-stone-900">
                  Comparer des offres
                </span>
                <span className="block text-xs text-stone-500 font-medium">
                  Jusqu’à 4 offres : Marjane, BIM, Carrefour...
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-[#006233] group-hover:translate-x-1 transition" />
          </button>
        </div>

        {/* ACCÈS RAPIDE À L'HISTORIQUE */}
        <div className="p-4 bg-stone-100/90 border border-stone-200 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-stone-800 flex items-center justify-center shadow-xs">
              <History className="w-5 h-5 text-[#006233]" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block">
                Historique des prix
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                {recentObservations.length === 0
                  ? 'Aucune observation enregistrée'
                  : `${recentObservations.length} prix enregistré${
                      recentObservations.length > 1 ? 's' : ''
                    }`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('history')}
            className="px-3.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 hover:bg-stone-50 shadow-xs transition"
          >
            Consulter
          </button>
        </div>

        {/* STATISTICAL SIGNALS EXPLANATION CARD (User Rule Requirement) */}
        <div className="p-4 bg-white border border-stone-200 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#006233]" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
              Signaux de prix objectifs & statistiques
            </h2>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            VraiPrix Maroc ne prétend jamais qu’un prix est intéressant sans données suffisantes.
            Aucun prix n’est inventé :
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-emerald-900 text-[11px] block">
                  🟢 PRIX INTÉRESSANT
                </span>
                <span className="text-[10px] text-emerald-700 leading-tight block">
                  Moins cher que la moyenne constatée
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2">
              <MinusCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-amber-900 text-[11px] block">
                  🟡 DANS LA MOYENNE
                </span>
                <span className="text-[10px] text-amber-700 leading-tight block">
                  Prix conforme au marché habituel
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-rose-900 text-[11px] block">
                  🔴 PRIX ÉLEVÉ
                </span>
                <span className="text-[10px] text-rose-700 leading-tight block">
                  Sensiblement plus cher qu'ailleurs
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-stone-100 border border-stone-200 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-stone-800 text-[11px] block">
                  ⚪ DONNÉES INSUFFISANTES
                </span>
                <span className="text-[10px] text-stone-600 leading-tight block">
                  Pas assez d'observations fiables
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK RECENT OBSERVATIONS PREVIEW (IF ANY) */}
        {recentObservations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-stone-800">
                Vos dernières observations
              </span>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-[#006233] hover:underline"
              >
                Voir tout ({recentObservations.length})
              </button>
            </div>

            <div className="space-y-2">
              {recentObservations.slice(0, 2).map((obs) => (
                <div
                  key={obs.id}
                  className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center justify-between shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-stone-900 truncate block">
                      {obs.productName}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {obs.store} • {obs.city}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-stone-900 block">
                      {formatDH(obs.price)}
                    </span>
                    <span className="text-[10px] font-bold text-[#006233]">
                      {formatDH(obs.unitPrice)}/{obs.baseUnit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
