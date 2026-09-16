import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ProductInfo, PriceObservation, PriceSignalResult } from '../types';
import { fetchProductByBarcode } from '../services/openFoodFacts';
import { playScanBeep, triggerHaptic, stopAllAudio } from '../utils/audio';
import { evaluatePriceSignal } from '../utils/priceSignal';
import { PriceSignalBadge } from './PriceSignalBadge';
import {
  Camera,
  RefreshCw,
  Keyboard,
  PlusCircle,
  Calculator,
  Scale,
  Package,
  AlertCircle,
  ExternalLink,
  Flashlight,
  CheckCircle2,
} from 'lucide-react';
import { formatDH } from '../utils/formatters';

// Supported barcode formats for retail
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

/**
 * Isolated Camera Viewfinder Component
 * Handles its own hardware lifecycle: mounts -> starts camera, unmounts -> stops all tracks & clears scanner.
 */
interface CameraViewfinderProps {
  sessionId: number;
  onCodeDetected: (code: string) => void;
  onManualClick: () => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onScannerActiveChange?: (active: boolean) => void;
}

const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  sessionId,
  onCodeDetected,
  onManualClick,
  soundEnabled,
  hapticsEnabled,
  onScannerActiveChange,
}) => {
  const containerId = `camera-viewport-${sessionId}`;
  const [scannerActive, setScannerActive] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanSuccessAnim, setScanSuccessAnim] = useState(false);

  const propsRef = useRef({
    onCodeDetected,
    soundEnabled,
    hapticsEnabled,
    onScannerActiveChange,
  });
  propsRef.current = {
    onCodeDetected,
    soundEnabled,
    hapticsEnabled,
    onScannerActiveChange,
  };

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isLockedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Clean stop of hardware media tracks
  const stopHardwareTracks = () => {
    try {
      const container = document.getElementById(containerId);
      if (container) {
        const videoEls = container.querySelectorAll('video');
        videoEls.forEach((video) => {
          try {
            if (video.srcObject && 'getTracks' in (video.srcObject as MediaStream)) {
              const stream = video.srcObject as MediaStream;
              stream.getTracks().forEach((track) => {
                try {
                  track.stop();
                } catch {}
              });
            }
          } catch {}
        });
      }
    } catch {}
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn(!torchOn);
    } catch {}
  };

  useEffect(() => {
    isMountedRef.current = true;
    isLockedRef.current = false;
    let html5QrCode: Html5Qrcode | null = null;

    const initCamera = async () => {
      // Small pause to guarantee container layout is rendered in DOM
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (!isMountedRef.current) return;

      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';

      try {
        html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: SUPPORTED_FORMATS,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 180 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // SYNCHRONOUS LOCK: instantly block all subsequent frames
            if (!isMountedRef.current || isLockedRef.current) return;
            isLockedRef.current = true;

            const clean = decodedText.trim();
            if (!clean) return;

            // Single beep & vibration
            playScanBeep(propsRef.current.soundEnabled);
            triggerHaptic(propsRef.current.hapticsEnabled, 80);

            // Flash animation
            setScanSuccessAnim(true);

            // Notify parent of detected barcode
            propsRef.current.onCodeDetected(clean);
          },
          () => {
            // Frame without barcode
          }
        );

        if (!isMountedRef.current) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(() => {});
          }
          try {
            html5QrCode.clear();
          } catch {}
          stopHardwareTracks();
          return;
        }

        setScannerActive(true);
        setIsStarting(false);
        propsRef.current.onScannerActiveChange?.(true);

        try {
          const caps = html5QrCode.getRunningTrackCapabilities?.() as { torch?: boolean };
          if (caps && 'torch' in caps) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        setIsStarting(false);
        setScannerActive(false);
        propsRef.current.onScannerActiveChange?.(false);

        const errStr = String(err).toLowerCase();
        if (
          errStr.includes('permission') ||
          errStr.includes('notallowed') ||
          errStr.includes('denied')
        ) {
          setPermissionDenied(true);
          setErrorMessage(
            'Impossible d’accéder à la caméra. Vérifiez l’autorisation dans votre navigateur.'
          );
        } else {
          setErrorMessage(
            'Impossible de démarrer la caméra. Vous pouvez saisir le code-barres manuellement.'
          );
        }
      }
    };

    initCamera();

    return () => {
      isMountedRef.current = false;
      isLockedRef.current = true;
      propsRef.current.onScannerActiveChange?.(false);

      // Synchronously stop all sounds
      stopAllAudio();

      // Teardown scanner instance safely
      if (scannerRef.current) {
        const instance = scannerRef.current;
        scannerRef.current = null;
        try {
          if (instance.isScanning) {
            instance
              .stop()
              .catch(() => {})
              .finally(() => {
                try {
                  instance.clear();
                } catch {}
                stopHardwareTracks();
              });
          } else {
            try {
              instance.clear();
            } catch {}
            stopHardwareTracks();
          }
        } catch {
          stopHardwareTracks();
        }
      } else {
        stopHardwareTracks();
      }
    };
  }, [containerId]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-black aspect-square max-h-[360px] shadow-lg border border-stone-800 flex items-center justify-center">
      {/* Container where html5-qrcode attaches video */}
      <div id={containerId} className="w-full h-full object-cover" />

      {/* Starting spinner */}
      {isStarting && !errorMessage && !permissionDenied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/80 text-white gap-2">
          <div className="w-8 h-8 border-3 border-[#006233] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-300">Démarrage de la caméra…</span>
        </div>
      )}

      {/* Reticle Overlay */}
      {scannerActive && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`relative w-[260px] h-[180px] rounded-2xl border-2 transition-all duration-300 ${
              scanSuccessAnim
                ? 'border-emerald-400 bg-emerald-500/20 scale-105'
                : 'border-white/80 shadow-2xl'
            }`}
          >
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#006233] rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#006233] rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#006233] rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#006233] rounded-br-lg" />

            {/* Animated Laser Scanning Line */}
            <div className="absolute inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-[#F3C64F] to-transparent animate-scan-laser shadow-[0_0_8px_#F3C64F]" />

            <div className="absolute bottom-2 inset-x-0 text-center">
              <span className="text-[10px] font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                Alignez le code-barres
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Flashlight button */}
      {hasTorch && scannerActive && (
        <button
          onClick={toggleTorch}
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md text-white transition ${
            torchOn ? 'bg-amber-500 text-stone-900' : 'bg-black/50 hover:bg-black/70'
          }`}
          title="Lampe torche"
        >
          <Flashlight className="w-4 h-4" />
        </button>
      )}

      {/* Camera Permission / Error Overlay */}
      {(permissionDenied || errorMessage) && !isStarting && (
        <div className="absolute inset-0 bg-stone-900/95 p-6 flex flex-col items-center justify-center text-center text-white space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="text-xs text-stone-300 leading-relaxed max-w-xs">{errorMessage}</p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#006233] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
            <button
              onClick={onManualClick}
              className="px-4 py-2 bg-white/20 text-white rounded-xl text-xs font-semibold"
            >
              Saisie manuelle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ScannerViewProps {
  onOpenCalculatorWithProduct: (product: ProductInfo) => void;
  onOpenCompareWithProduct: (product: ProductInfo) => void;
  onAddObservationForProduct: (product: ProductInfo) => void;
  observations: PriceObservation[];
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  scanSessionTrigger?: number;
  lastEvaluationResult?: PriceSignalResult | null;
  onClearEvaluationResult?: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onOpenCalculatorWithProduct,
  onOpenCompareWithProduct,
  onAddObservationForProduct,
  observations,
  soundEnabled,
  hapticsEnabled,
  scanSessionTrigger,
  lastEvaluationResult,
  onClearEvaluationResult,
}) => {
  // Session counter that forces a brand new clean mount of CameraViewfinder on each restart
  const [sessionId, setSessionId] = useState(1);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Scanning vs Results state
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productData, setProductData] = useState<ProductInfo | null>(null);
  const [productNotFound, setProductNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual input state
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Abort controller to cancel in-flight network requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on component unmount (e.g. navigation to another tab)
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Product lookup strictly isolated by AbortController
   */
  const lookupProduct = useCallback(async (code: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingProduct(true);
    setProductNotFound(false);
    setProductData(null);
    setErrorMessage(null);

    try {
      const result = await fetchProductByBarcode(code, controller.signal);

      if (controller.signal.aborted) return;

      if (result.found && result.product) {
        setProductData(result.product);
        setProductNotFound(false);
      } else {
        setProductData(null);
        setProductNotFound(true);
        if (result.error && result.error !== 'Recherche annulée') {
          setErrorMessage(result.error);
        }
      }
    } catch {
      if (controller.signal.aborted) return;
      setProductData(null);
      setProductNotFound(true);
      setErrorMessage('Erreur lors de la recherche du produit.');
    } finally {
      if (!controller.signal.aborted) {
        setLoadingProduct(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  /**
   * Called when a barcode is detected by the active camera viewfinder
   */
  const handleCodeDetected = useCallback((code: string) => {
    setScannedCode(code);
    lookupProduct(code);
  }, [lookupProduct]);

  /**
   * Manual submission
   */
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (!clean) return;

    setShowManualInput(false);
    setScannedCode(clean);
    lookupProduct(clean);
  };

  /**
   * RESTART SCANNER: startNewScannerSession
   * Fully resets previous results, cuts audio, aborts network queries,
   * clears scannedCode so CameraViewfinder mounts freshly with a new sessionId.
   * Shared by both "Scanner à nouveau" and the central 📷 navigation button.
   */
  const startNewScannerSession = React.useCallback(() => {
    // 1. Cut any audio immediately
    stopAllAudio();

    // 2. Abort any running search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 3. Reset all result states
    setScannedCode(null);
    setProductData(null);
    setProductNotFound(false);
    setLoadingProduct(false);
    setErrorMessage(null);
    setShowManualInput(false);
    setManualCode('');

    // 4. Increment sessionId to guarantee a completely new DOM container and fresh camera instance
    setSessionId((prev) => prev + 1);
    onClearEvaluationResult?.();
  }, [onClearEvaluationResult]);

  // Handle external triggers from central 📷 button
  const prevTriggerRef = useRef(scanSessionTrigger);
  useEffect(() => {
    if (scanSessionTrigger !== undefined && scanSessionTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = scanSessionTrigger;
      onClearEvaluationResult?.();
      startNewScannerSession();
    }
  }, [scanSessionTrigger, startNewScannerSession, onClearEvaluationResult]);

  // Check if we have matching observations for this product
  const matchedObservations = productData
    ? observations.filter(
        (o) =>
          Boolean(
            (productData.barcode && o.barcode === productData.barcode) ||
            o.productName.toLowerCase().includes(productData.name.toLowerCase()) ||
            productData.name.toLowerCase().includes(o.productName.toLowerCase())
          )
      )
    : [];

  // Check if last evaluation belongs to this product
  const isLastEvaluationForThisProduct = Boolean(
    lastEvaluationResult &&
    productData &&
    (
      lastEvaluationResult.evaluatedRawPrice !== undefined ||
      (productData.barcode && lastEvaluationResult.priorObservationsUsed?.some((o) => o.barcode === productData.barcode))
    )
  );

  const activeSignal = isLastEvaluationForThisProduct
    ? lastEvaluationResult
    : productData && matchedObservations.length > 0 && matchedObservations[0].unitPrice > 0
    ? evaluatePriceSignal({
        currentUnitPrice: matchedObservations[0].unitPrice,
        baseUnit: matchedObservations[0].baseUnit,
        productNameOrBarcode: productData.barcode || productData.name,
        observations,
      })
    : null;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
      {/* Title & Instructions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#006233]" />
            <span>Scanner un code-barres</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Placez le code-barres (EAN-13, EAN-8) dans le cadre
          </p>
        </div>

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
        >
          <Keyboard className="w-3.5 h-3.5 text-stone-600" />
          <span>Saisie</span>
        </button>
      </div>

      {/* Manual Input Form */}
      {showManualInput && (
        <form
          onSubmit={handleManualSubmit}
          className="p-3.5 bg-stone-100 border border-stone-200 rounded-2xl space-y-2 animate-fade-in"
        >
          <label className="block text-xs font-bold text-stone-700">
            Saisir le code-barres manuellement :
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="Ex: 6111234567890"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006233]"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#006233] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#004d27]"
            >
              Rechercher
            </button>
          </div>
        </form>
      )}

      {/* CAMERA VIEWFINDER: Mounted whenever no code is scanned */}
      {!scannedCode && (
        <CameraViewfinder
          key={sessionId}
          sessionId={sessionId}
          onCodeDetected={handleCodeDetected}
          onManualClick={() => setShowManualInput(true)}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
          onScannerActiveChange={setIsCameraActive}
        />
      )}

      {/* RESULTS DISPLAY: Rendered when a code is scanned */}
      {scannedCode && (
        <div className="space-y-4 animate-fade-in">
          {/* Scanned Barcode Pill & Restart Button */}
          <div className="p-3 bg-stone-100 rounded-2xl flex items-center justify-between border border-stone-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#006233]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Code scanné
                </span>
                <span className="font-mono text-xs font-extrabold text-stone-900 tracking-wider">
                  {scannedCode}
                </span>
              </div>
            </div>
            <button
              onClick={startNewScannerSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition shadow-xs active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#006233]" />
              <span>Scanner à nouveau</span>
            </button>
          </div>

          {/* Loading state */}
          {loadingProduct && (
            <div className="p-8 bg-white border border-stone-200 rounded-3xl text-center space-y-3 shadow-xs">
              <div className="w-8 h-8 border-3 border-[#006233] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-stone-600">Recherche du produit…</p>
            </div>
          )}

          {/* Product Found Card */}
          {!loadingProduct && productData && (
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3.5">
                {productData.imageUrl ? (
                  <img
                    src={productData.imageUrl}
                    alt={productData.name}
                    className="w-16 h-16 object-contain rounded-2xl bg-stone-50 border border-stone-100 p-1 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#006233] flex items-center justify-center shrink-0">
                    <Package className="w-7 h-7" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {productData.brand && (
                    <span className="text-[11px] font-bold text-[#006233] uppercase tracking-wider block">
                      {productData.brand}
                    </span>
                  )}
                  <h2 className="text-base font-extrabold text-stone-900 leading-snug">
                    {productData.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {productData.quantity && productData.unit && (
                      <span className="inline-flex items-center text-[11px] font-semibold bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md">
                        Format : {productData.quantity} {productData.unit}
                      </span>
                    )}
                    {productData.category && (
                      <span className="inline-flex items-center text-[10px] text-stone-500 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                        {productData.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Source attribution */}
              <div className="text-[10px] text-stone-400 flex items-center gap-1 border-t border-stone-100 pt-2">
                <span>Source : Open Food Facts (licence libre ODbL)</span>
                <ExternalLink className="w-3 h-3 inline" />
              </div>

              {/* Price Signal if user has observations or newly evaluated price */}
              {activeSignal && (
                <div className="pt-2 space-y-2">
                  <PriceSignalBadge signal={activeSignal} />
                  {isLastEvaluationForThisProduct && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ce prix a bien été enregistré dans votre historique.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Previous observations summary when not in fresh evaluation mode */}
              {!isLastEvaluationForThisProduct && matchedObservations.length > 0 && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1.5">
                  <span className="font-bold text-stone-700 block">
                    Observations enregistrées ({matchedObservations.length}) :
                  </span>
                  {matchedObservations.slice(0, 3).map((obs) => (
                    <div key={obs.id} className="flex justify-between items-center text-[11px]">
                      <span className="text-stone-600">
                        {obs.store} ({obs.city})
                      </span>
                      <span className="font-bold text-stone-900">
                        {formatDH(obs.price)} ({formatDH(obs.unitPrice)}/{obs.baseUnit})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => onAddObservationForProduct(productData)}
                  className="py-2.5 px-3 bg-[#006233] text-white rounded-xl text-xs font-bold hover:bg-[#004d27] active:scale-[0.99] transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Enregistrer prix</span>
                </button>

                <button
                  onClick={() => onOpenCalculatorWithProduct(productData)}
                  className="py-2.5 px-3 bg-stone-100 text-stone-800 rounded-xl text-xs font-bold hover:bg-stone-200 active:scale-[0.99] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-[#006233]" />
                  <span>Calculer le prix</span>
                </button>

                <button
                  onClick={() => onOpenCompareWithProduct(productData)}
                  className="py-2.5 px-3 bg-stone-100 text-stone-800 rounded-xl text-xs font-bold hover:bg-stone-200 active:scale-[0.99] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-4 h-4 text-[#006233]" />
                  <span>Comparer</span>
                </button>
              </div>
            </div>
          )}

          {/* Product NOT FOUND Card */}
          {!loadingProduct && productNotFound && (
            <div className="bg-white border border-stone-200 rounded-3xl p-6 text-center shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <Package className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900">Produit non trouvé</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Ce code-barres n'est pas encore répertorié dans la base ouverte. Vous pouvez
                  l'ajouter manuellement avec son nom et son prix.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() =>
                    onAddObservationForProduct({
                      barcode: scannedCode,
                      name: '',
                    })
                  }
                  className="w-full py-3 bg-[#006233] hover:bg-[#004d27] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Ajouter le produit et son prix</span>
                </button>

                <button
                  onClick={startNewScannerSession}
                  className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <RefreshCw className="w-4 h-4 text-[#006233]" />
                  <span>Scanner un nouveau produit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
