import React from 'react';
import { ActiveTab } from '../types';
import { Shield, Camera, Database, Lock, UserX, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ setActiveTab }) => {
  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('home')}
          className="p-2 -ml-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#006233]" />
            <span>Politique de confidentialité</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Transparence totale et respect de votre vie privée
          </p>
        </div>
      </div>

      {/* Main commitments cards */}
      <div className="space-y-3">
        {/* 1. Caméra */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 text-[#006233]">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              1. Utilisation de la caméra
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            L’accès à votre caméra sert <strong>exclusivement</strong> à analyser en temps réel les
            codes-barres des produits (EAN-13, EAN-8) sur votre appareil. Le flux vidéo n'est
            jamais enregistré, diffusé ni transmis à des serveurs tiers.
          </p>
        </div>

        {/* 2. Photos & Preuves */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 text-[#006233]">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              2. Photos d'étiquettes ou de tickets
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Si vous décidez d'associer une photo d'étiquette de prix ou de ticket de caisse à une
            observation, cette image reste <strong>strictement stockée sur votre téléphone</strong>.
            Aucune image n’est utilisée ni partagée sans votre accord explicite.
          </p>
        </div>

        {/* 3. Données de prix */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 text-[#006233]">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              3. Utilisation des observations de prix
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Les observations de prix que vous enregistrez servent exclusivement à calculer les vrais
            prix unitaires, vous alerter sur les offres réelles et comparer les magasins et villes.
            <strong> Aucune revente de données personnelles n'a lieu ni n'aura jamais lieu.</strong>
          </p>
        </div>

        {/* 4. Aucun compte obligatoire */}
        <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 text-[#006233]">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-stone-900">
              4. Utilisation anonyme sans compte
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed pl-10">
            Vous pouvez utiliser 100% des fonctions principales (scanner, calculateur de réduction,
            comparateur de 4 offres, historique complet) sans avoir à créer de compte, sans fournir
            d'adresse email, ni de numéro de téléphone.
          </p>
        </div>

        {/* 5. Données ouvertes Open Food Facts */}
        <div className="p-4 bg-stone-50 rounded-3xl border border-stone-200 text-xs text-stone-600 space-y-1.5">
          <span className="font-bold text-stone-800 block">Base ouverte Open Food Facts :</span>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            Les informations descriptives des produits alimentaires proviennent de la base de données
            collaborative ouverte Open Food Facts, distribuée sous licence Open Database License
            (ODbL).
          </p>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => setActiveTab('home')}
          className="w-full py-3 bg-[#006233] text-white rounded-2xl text-xs font-bold hover:bg-[#004d27] transition flex items-center justify-center gap-2 shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>
      </div>
    </div>
  );
};
