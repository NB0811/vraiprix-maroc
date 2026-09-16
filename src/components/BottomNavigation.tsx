import React from 'react';
import { ActiveTab } from '../types';
import { Home, Camera, Calculator, Scale, History } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onCentralScannerClick?: () => void;
  observationCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  setActiveTab,
  onCentralScannerClick,
  observationCount = 0,
}) => {
  return (
    <nav
      id="bottom-navigation"
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {/* Accueil */}
        <button
          id="nav-tab-home"
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            activeTab === 'home' ? 'text-[#006233] font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-1">Accueil</span>
        </button>

        {/* Calculer */}
        <button
          id="nav-tab-calculator"
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            activeTab === 'calculator'
              ? 'text-[#006233] font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Calculator
            className={`w-5 h-5 ${activeTab === 'calculator' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
          />
          <span className="text-[10px] mt-1">Calculer</span>
        </button>

        {/* SCANNER - Primary central action */}
        <button
          id="nav-tab-scanner"
          onClick={() => {
            if (onCentralScannerClick) {
              onCentralScannerClick();
            } else {
              setActiveTab('scanner');
            }
          }}
          aria-label="Scanner un code-barres"
          className="relative -top-3 flex flex-col items-center justify-center group focus:outline-none cursor-pointer"
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              activeTab === 'scanner'
                ? 'bg-[#006233] text-white ring-4 ring-emerald-100 shadow-emerald-900/20'
                : 'bg-gradient-to-tr from-[#006233] to-[#0b8045] text-white shadow-emerald-950/20 hover:brightness-105'
            }`}
          >
            <Camera className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span
            className={`text-[10px] mt-0.5 font-bold ${
              activeTab === 'scanner' ? 'text-[#006233]' : 'text-stone-600'
            }`}
          >
            Scanner
          </span>
        </button>

        {/* Comparer */}
        <button
          id="nav-tab-compare"
          onClick={() => setActiveTab('compare')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            activeTab === 'compare' ? 'text-[#006233] font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Scale
            className={`w-5 h-5 ${activeTab === 'compare' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
          />
          <span className="text-[10px] mt-1">Comparer</span>
        </button>

        {/* Historique */}
        <button
          id="nav-tab-history"
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 relative transition-colors ${
            activeTab === 'history' ? 'text-[#006233] font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className="relative">
            <History
              className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`}
            />
            {observationCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] bg-[#C1272D] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {observationCount > 99 ? '99+' : observationCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Historique</span>
        </button>
      </div>
    </nav>
  );
};
