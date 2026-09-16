import React, { useState, useEffect } from 'react';
import { ActiveTab, PriceObservation, ProductInfo, PriceUnit, UserPreferences, PriceSignalResult } from './types';
import {
  loadObservations,
  saveObservation,
  deleteObservation,
  clearAllObservations,
  loadPreferences,
  savePreferences,
} from './services/storageService';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { HomeView } from './components/HomeView';
import { ScannerView } from './components/ScannerView';
import { CalculatorView } from './components/CalculatorView';
import { CompareView } from './components/CompareView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { AddObservationModal } from './components/AddObservationModal';
import { EvaluationResultModal } from './components/EvaluationResultModal';
import { stopAllAudio } from './utils/audio';
import { evaluateNewPrice } from './utils/priceSignal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [observations, setObservations] = useState<PriceObservation[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences());
  const [scanSessionTrigger, setScanSessionTrigger] = useState(0);
  const [lastEvaluationResult, setLastEvaluationResult] = useState<PriceSignalResult | null>(null);

  // Defensive safety: whenever activeTab changes away from scanner, stop all audio
  useEffect(() => {
    if (activeTab !== 'scanner') {
      stopAllAudio();
    }
  }, [activeTab]);

  const handleTabChange = (newTab: ActiveTab) => {
    if (activeTab === 'scanner' && newTab !== 'scanner') {
      stopAllAudio();
    }
    setActiveTab(newTab);
  };

  /**
   * CENTRAL SCANNER ACTION (Bottom Nav 📷 & Home Hero Button)
   * Acts as an imperative command: "NOUVEAU SCAN"
   * - If not on scanner: navigate to scanner and start fresh
   * - If already on scanner: trigger restart (resets results, invalidates callbacks, starts clean session)
   */
  const handleCentralScannerClick = () => {
    stopAllAudio();
    setLastEvaluationResult(null);
    setScanSessionTrigger((prev) => prev + 1);
    if (activeTab !== 'scanner') {
      setActiveTab('scanner');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Inter-tab communication states
  const [calcProduct, setCalcProduct] = useState<ProductInfo | null>(null);
  const [compareProduct, setCompareProduct] = useState<{
    productName: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    unit: PriceUnit;
  } | null>(null);

  // Add observation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<Partial<PriceObservation> | undefined>(
    undefined
  );

  // Load observations from storage on mount
  useEffect(() => {
    setObservations(loadObservations());
  }, []);

  const handleSaveObservation = (obs: PriceObservation) => {
    // 1. Collect ONLY prior observations from storage before adding the new observation
    const priorObservations = loadObservations();

    // 2. Evaluate the new price against prior observations strictly (excluding the new price!)
    const evaluation = evaluateNewPrice({
      currentUnitPrice: obs.unitPrice,
      baseUnit: obs.baseUnit,
      productNameOrBarcode: obs.barcode || obs.productName,
      priorObservations,
      city: obs.city,
      store: obs.store,
      evaluatedRawPrice: obs.price,
      evaluatedObservationId: obs.id,
    });

    setLastEvaluationResult(evaluation);

    // 3. Now save the new observation to storage for future reference
    saveObservation(obs);
    setObservations(loadObservations());
  };

  const handleDeleteObservation = (id: string) => {
    deleteObservation(id);
    setObservations(loadObservations());
  };

  const handleClearAllObservations = () => {
    clearAllObservations();
    setObservations([]);
    setLastEvaluationResult(null);
  };

  const handleUpdatePreferences = (updates: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    savePreferences(updated);
  };

  const handleOpenCalculatorWithProduct = (product: ProductInfo) => {
    setCalcProduct(product);
    handleTabChange('calculator');
  };

  const handleOpenCompareWithProduct = (product: ProductInfo) => {
    setCompareProduct({
      productName: product.name,
      price: 0,
      quantity: product.quantity || 1,
      unit: product.unit || 'kg',
    });
    handleTabChange('compare');
  };

  const handleAddObservationForProduct = (product: ProductInfo) => {
    setModalInitialData({
      barcode: product.barcode,
      productName: product.name,
      brand: product.brand,
      quantity: product.quantity || 1,
      unit: product.unit || 'kg',
      city: preferences.defaultCity,
      store: preferences.defaultStore,
    });
    setIsModalOpen(true);
  };

  const handleAddNewEmptyObservation = () => {
    setModalInitialData({
      city: preferences.defaultCity,
      store: preferences.defaultStore,
    });
    setIsModalOpen(true);
  };

  const handleEditObservation = (obs: PriceObservation) => {
    setModalInitialData(obs);
    setIsModalOpen(true);
  };

  const handleSendToCompareFromCalc = (data: {
    productName: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    unit: PriceUnit;
  }) => {
    setCompareProduct(data);
    handleTabChange('compare');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-stone-900 flex flex-col font-sans selection:bg-[#006233] selection:text-white">
      {/* Sticky Header */}
      <Header activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* PWA Install Banner (only displayed if installable / iOS) */}
      <PWAInstallBanner />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {activeTab === 'home' && (
          <HomeView
            setActiveTab={handleTabChange}
            onOpenScanner={handleCentralScannerClick}
            recentObservations={observations}
            onAddNewObservation={handleAddNewEmptyObservation}
          />
        )}

        {activeTab === 'scanner' && (
          <ScannerView
            onOpenCalculatorWithProduct={handleOpenCalculatorWithProduct}
            onOpenCompareWithProduct={handleOpenCompareWithProduct}
            onAddObservationForProduct={handleAddObservationForProduct}
            observations={observations}
            soundEnabled={preferences.soundEnabled}
            hapticsEnabled={preferences.hapticsEnabled}
            scanSessionTrigger={scanSessionTrigger}
            lastEvaluationResult={lastEvaluationResult}
            onClearEvaluationResult={() => setLastEvaluationResult(null)}
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorView
            initialProduct={calcProduct}
            onSaveAsObservation={(data) => {
              setModalInitialData({
                ...data,
                city: preferences.defaultCity,
                store: preferences.defaultStore,
              });
              setIsModalOpen(true);
            }}
            onSendToCompare={handleSendToCompareFromCalc}
            observations={observations}
          />
        )}

        {activeTab === 'compare' && (
          <CompareView
            onSaveObservation={handleSaveObservation}
            incomingOffer={compareProduct}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            observations={observations}
            onDeleteObservation={handleDeleteObservation}
            onAddNewObservation={handleAddNewEmptyObservation}
            onEditObservation={handleEditObservation}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            setActiveTab={handleTabChange}
            onDataReload={() => setObservations(loadObservations())}
            onClearAllObservations={handleClearAllObservations}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacyPolicyView setActiveTab={handleTabChange} />
        )}
      </main>

      {/* Mobile-first Bottom Navigation Bar */}
      <BottomNavigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onCentralScannerClick={handleCentralScannerClick}
        observationCount={observations.length}
      />

      {/* Add Observation Modal */}
      <AddObservationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialData(undefined);
        }}
        onSave={handleSaveObservation}
        initialData={modalInitialData}
        defaultCity={preferences.defaultCity}
        defaultStore={preferences.defaultStore}
      />

      {/* Evaluation Result Modal when saved outside Scanner view */}
      <EvaluationResultModal
        isOpen={Boolean(lastEvaluationResult && activeTab !== 'scanner')}
        onClose={() => setLastEvaluationResult(null)}
        signal={lastEvaluationResult}
        onGoToHistory={() => handleTabChange('history')}
      />
    </div>
  );
}
