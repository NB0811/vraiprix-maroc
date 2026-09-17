import React, { useState, useRef } from 'react';
import { UserPreferences, ActiveTab } from '../types';
import { MOROCCAN_CITIES, KNOWN_MOROCCAN_STORES } from '../data/moroccoData';
import { exportBackupJSON, importBackupJSON, clearAllObservations } from '../services/storageService';
import {
  Settings,
  MapPin,
  Store,
  Volume2,
  Vibrate,
  Download,
  Upload,
  Trash2,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onDataReload: () => void;
  onClearAllObservations?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences,
  setActiveTab,
  onDataReload,
  onClearAllObservations,
}) => {
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vraiprix_maroc_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportMessage('Sauvegarde exportée avec succès !');
    setTimeout(() => setExportMessage(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackupJSON(content);
      if (res.success) {
        setImportMessage(`${res.count} observation(s) importée(s) avec succès.`);
        onDataReload();
      } else {
        setImportMessage(res.error || "Échec de l'import.");
      }
      setTimeout(() => setImportMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleConfirmDelete = () => {
    if (onClearAllObservations) {
      onClearAllObservations();
    } else {
      clearAllObservations();
      onDataReload();
    }
    setShowConfirmModal(false);
    setDeleteSuccessMessage('Toutes les observations ont été supprimées.');
    setTimeout(() => setDeleteSuccessMessage(null), 3500);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-28 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('home')}
          className="p-2 -ml-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#006233]" />
            <span>Paramètres</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Préférences locales et sauvegarde de vos données
          </p>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
          Préférences régionales
        </h2>

        {/* Default City */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#006233]" />
            <span>Ville par défaut</span>
          </label>
          <select
            value={preferences.defaultCity}
            onChange={(e) => onUpdatePreferences({ defaultCity: e.target.value })}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900"
          >
            {MOROCCAN_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Default Store */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-[#006233]" />
            <span>Magasin habituel</span>
          </label>
          <select
            value={preferences.defaultStore}
            onChange={(e) => onUpdatePreferences({ defaultStore: e.target.value })}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900"
          >
            {KNOWN_MOROCCAN_STORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sound & Haptics Feedback Card */}
      <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
          Retour sonore & vibration
        </h2>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-stone-600" />
            <div>
              <span className="text-xs font-bold text-stone-900 block">Bip sonore au scan</span>
              <span className="text-[10px] text-stone-500">Chime Web Audio à la détection</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.soundEnabled}
            onChange={(e) => onUpdatePreferences({ soundEnabled: e.target.checked })}
            className="w-4 h-4 text-[#006233] accent-[#006233] rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-1 border-t border-stone-100">
          <div className="flex items-center gap-2.5">
            <Vibrate className="w-4 h-4 text-stone-600" />
            <div>
              <span className="text-xs font-bold text-stone-900 block">Vibration tactile</span>
              <span className="text-[10px] text-stone-500">Légère vibration sur mobile</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.hapticsEnabled}
            onChange={(e) => onUpdatePreferences({ hapticsEnabled: e.target.checked })}
            className="w-4 h-4 text-[#006233] accent-[#006233] rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Backup & Data Management Card */}
      <div className="p-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
          Sauvegarde & Exportation
        </h2>

        {exportMessage && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{exportMessage}</span>
          </div>
        )}

        {importMessage && (
          <div className="p-2.5 bg-blue-50 text-blue-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{importMessage}</span>
          </div>
        )}

        {deleteSuccessMessage && (
          <div
            id="clear-observations-success-banner"
            className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-bold">{deleteSuccessMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importer JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        <div className="pt-2 border-t border-stone-100">
          <button
            id="btn-trigger-clear-all-observations"
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="w-full py-2.5 px-3 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Effacer toutes mes observations</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing All Observations */}
      {showConfirmModal && (
        <div
          id="confirm-delete-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div
            id="confirm-delete-modal-card"
            className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 border border-stone-200 max-h-[calc(100dvh-2rem)] overflow-y-auto my-auto"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="confirm-delete-title" className="text-base font-black text-stone-900">
                  Effacer toutes les observations ?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Cette action supprimera définitivement tous les prix et observations enregistrés sur cet appareil. Cette action est irréversible.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <button
                id="btn-cancel-clear-observations"
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition cursor-pointer text-center flex items-center justify-center"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-clear-observations"
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer text-center shadow-xs flex items-center justify-center"
              >
                Tout effacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & App Info */}
      <div className="p-4 bg-stone-100 rounded-3xl text-xs text-stone-600 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#006233]" />
            <span className="font-bold text-stone-800">VraiPrix Maroc PWA</span>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">v1.0.0</span>
        </div>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          Application 100% respectueuse de la vie privée. Fonctionne hors-ligne sans compte
          obligatoire. Vos données et observations restent enregistrées sur votre appareil.
        </p>

        <a
          id="link-privacy-policy"
          href="/privacy.html"
          className="w-full py-2.5 px-3 bg-white hover:bg-emerald-50 text-[#006233] border border-stone-200 rounded-xl text-xs font-bold transition flex items-center justify-between shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Politique de confidentialité</span>
          </div>
          <span className="text-stone-400 group-hover:text-[#006233]">→</span>
        </a>
      </div>
    </div>
  );
};
