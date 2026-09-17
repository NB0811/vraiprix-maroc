import React, { useEffect } from 'react';
import { ActiveTab } from '../types';
import {
  Shield,
  Camera,
  Image as ImageIcon,
  Package,
  Database,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';

interface PrivacyPolicyViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ setActiveTab }) => {
  useEffect(() => {
    document.title = 'Politique de confidentialité — VraiPrix Maroc';
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-28 animate-fade-in text-stone-900">
      {/* Top Navigation / Back button */}
      <div className="flex items-center gap-2">
        <button
          id="btn-back-from-privacy"
          onClick={() => setActiveTab('home')}
          className="p-2 -ml-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#006233]/10 text-[#006233] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006233]">
              Transparence & Vie Privée
            </span>
          </div>
        </div>
      </div>

      {/* Main Title & Last Update */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C1272D]/10 text-[#C1272D] text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C1272D]"></span>
          <span>Dernière mise à jour : 17 septembre 2026</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
          Politique de confidentialité — VraiPrix Maroc
        </h1>
        <p className="text-xs text-stone-600 leading-relaxed">
          Cette politique détaille de manière simple et transparente l’utilisation de vos données,
          des capteurs de votre appareil et le fonctionnement hors-ligne de l’application VraiPrix Maroc.
        </p>
      </div>

      {/* 9 Structured Sections */}
      <div className="space-y-3">
        {/* 1. Caméra et scanner */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              1. Caméra et scanner
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            VraiPrix Maroc utilise la caméra uniquement lorsque l’utilisateur choisit de scanner un code-barres. L’accès à la caméra sert au fonctionnement du scanner.
          </p>
        </div>

        {/* 2. Photos */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              2. Photos
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Lors de l’enregistrement d’une observation de prix, l’utilisateur peut volontairement prendre une photo d’une étiquette de prix ou d’un ticket. Cette fonction n’est utilisée que lorsque l’utilisateur la déclenche.
          </p>
        </div>

        {/* 3. Codes-barres et Open Food Facts */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              3. Codes-barres et Open Food Facts
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Lorsqu’un code-barres est scanné, VraiPrix Maroc peut interroger le service Open Food Facts afin d’obtenir les informations disponibles sur le produit correspondant. Le code-barres peut donc être transmis à ce service pour effectuer cette recherche.
          </p>
        </div>

        {/* 4. Historique et observations */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              4. Historique et observations
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Dans la version actuelle de VraiPrix Maroc, les observations de prix et l’historique sont enregistrés localement sur l’appareil de l’utilisateur tant qu’aucun service de synchronisation ou de base de données communautaire n’est activé.
          </p>
        </div>

        {/* 5. Données personnelles */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              5. Données personnelles
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            VraiPrix Maroc ne vend pas les données personnelles de ses utilisateurs.
          </p>
        </div>

        {/* 6. Autorisations */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              6. Autorisations
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Les autorisations telles que la caméra ou la prise de photo sont utilisées uniquement pour fournir les fonctionnalités demandées volontairement par l’utilisateur.
          </p>
        </div>

        {/* 7. Services tiers */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              7. Services tiers
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Le service tiers Open Food Facts est susceptible d’être contacté lors de la recherche d’informations sur un produit à partir de son code-barres.
          </p>
        </div>

        {/* 8. Évolution de l’application */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              8. Évolution de l’application
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Cette politique pourra être mise à jour si de nouvelles fonctionnalités ou de nouveaux services sont ajoutés à VraiPrix Maroc.
          </p>
        </div>

        {/* 9. Contact */}
        <div className="p-4 bg-stone-50 rounded-3xl border border-stone-200 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              9. Contact
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Pour toute question concernant cette politique de confidentialité, veuillez utiliser le moyen de contact indiqué sur la page officielle de VraiPrix Maroc.
          </p>
        </div>
      </div>

      {/* Return to App Button */}
      <div className="pt-2">
        <button
          id="btn-return-to-app"
          onClick={() => setActiveTab('home')}
          className="w-full py-3.5 bg-[#006233] text-white rounded-2xl text-xs font-bold hover:bg-[#004d27] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Retour à l’application</span>
        </button>
      </div>
    </div>
  );
};
