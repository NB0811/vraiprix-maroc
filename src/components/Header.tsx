import React from 'react';
import { ActiveTab } from '../types';
import { Settings, Shield, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand identity */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          {/* Official VraiPrix Maroc Logo */}
          <img
            src="/icon.svg"
            alt="Logo VraiPrix Maroc"
            className="w-9 h-9 rounded-xl object-contain shadow-xs border border-stone-200/80 group-hover:scale-105 transition"
          />

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-stone-900 leading-none">
                VraiPrix <span className="text-[#006233]">Maroc</span>
              </span>
            </div>
            <span className="block text-[10px] font-medium text-stone-500 leading-tight">
              Avant d’acheter, connais le vrai prix.
            </span>
          </div>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {!isOnline && (
            <div
              title="Mode hors-ligne actif (données locales)"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold"
            >
              <WifiOff className="w-3 h-3" />
              <span className="hidden sm:inline">Hors-ligne</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab('privacy')}
            title="Politique de confidentialité & Données"
            className={`p-2 rounded-xl text-xs transition ${
              activeTab === 'privacy'
                ? 'bg-emerald-50 text-[#006233]'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
            aria-label="Confidentialité"
          >
            <Shield className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            title="Paramètres"
            className={`p-2 rounded-xl text-xs transition ${
              activeTab === 'settings'
                ? 'bg-emerald-50 text-[#006233]'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
            aria-label="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
