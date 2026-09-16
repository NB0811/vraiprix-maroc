import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, X, Smartphone } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  if (isInstallable) {
    return (
      <div
        id="pwa-install-banner"
        className="mx-4 my-2 p-3 bg-gradient-to-r from-[#006233] to-[#004d27] rounded-2xl text-white shadow-md flex items-center justify-between gap-3 animate-fade-in"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">Installer VraiPrix Maroc</p>
            <p className="text-[11px] text-emerald-100 truncate">Accès rapide hors-ligne et scan immédiat</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="install-pwa-btn"
            onClick={install}
            className="flex items-center gap-1 bg-[#F3C64F] text-[#1A202C] hover:bg-[#e5ba45] active:scale-95 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Fermer"
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <>
        <div
          id="pwa-ios-banner"
          className="mx-4 my-2 p-3 bg-stone-900 text-white rounded-2xl shadow-md flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Ajouter à l'écran d'accueil</p>
              <p className="text-[11px] text-stone-300 truncate">Pour une expérience plein écran sur iPhone</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowIOSGuide(true)}
              className="text-xs font-semibold px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg"
            >
              Guide
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Fermer"
              className="p-1 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006233] flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Installer sur iPhone / iPad</h3>
              <div className="mt-3 space-y-2.5 text-xs text-stone-600 leading-relaxed">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#006233] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  Appuyez sur le bouton <strong>Partager</strong> <Share2 className="w-3.5 h-3.5 inline" /> dans Safari.
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#006233] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  Faites défiler et sélectionnez <strong>Sur l'écran d'accueil</strong>.
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#006233] font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  Appuyez sur <strong>Ajouter</strong> en haut à droite.
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white hover:bg-stone-800"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
