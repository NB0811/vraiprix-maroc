import { ProductInfo, PriceUnit } from '../types';

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const USER_AGENT = 'VraiPrixMaroc/1.0 (Web-PWA; contact@vraiprix.ma; https://vraiprix.ma)';

// Local storage key for offline product cache
const PRODUCT_CACHE_KEY = 'vraiprix_product_cache_v1';

function getCachedProducts(): Record<string, ProductInfo> {
  try {
    const raw = localStorage.getItem(PRODUCT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProductToCache(product: ProductInfo) {
  try {
    const cache = getCachedProducts();
    cache[product.barcode] = product;
    localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to cache product info', e);
  }
}

/**
 * Extracts quantity number and unit from raw string like "1 kg", "500g", "1.5 L", "330 ml".
 */
export function parseQuantityString(raw?: string): { quantity?: number; unit?: PriceUnit } {
  if (!raw) return {};

  const clean = raw.trim().toLowerCase().replace(',', '.');

  // Match e.g. "1.5 l", "500 g", "2 kg", "33 cl", "250 ml", "6 x 100g", "6 pièces"
  const massKgMatch = clean.match(/([\d.]+)\s*kg/);
  if (massKgMatch) {
    return { quantity: parseFloat(massKgMatch[1]), unit: 'kg' };
  }

  const massGMatch = clean.match(/([\d.]+)\s*g\b/);
  if (massGMatch) {
    return { quantity: parseFloat(massGMatch[1]), unit: 'g' };
  }

  const volLMatch = clean.match(/([\d.]+)\s*l\b/);
  if (volLMatch) {
    return { quantity: parseFloat(volLMatch[1]), unit: 'L' };
  }

  const volClMatch = clean.match(/([\d.]+)\s*cl\b/);
  if (volClMatch) {
    // 33 cl = 330 ml
    return { quantity: parseFloat(volClMatch[1]) * 10, unit: 'ml' };
  }

  const volMlMatch = clean.match(/([\d.]+)\s*ml\b/);
  if (volMlMatch) {
    return { quantity: parseFloat(volMlMatch[1]), unit: 'ml' };
  }

  const countMatch = clean.match(/([\d.]+)\s*(?:pièces|pieces|piece|pcs|unites|unite)/);
  if (countMatch) {
    return { quantity: parseFloat(countMatch[1]), unit: 'piece' };
  }

  return {};
}

export interface FetchProductResult {
  found: boolean;
  product?: ProductInfo;
  isOffline?: boolean;
  error?: string;
}

/**
 * Fetches product info from Open Food Facts or local cache.
 * Respects User-Agent, attribution, and handles network degradation.
 */
export async function fetchProductByBarcode(
  barcode: string,
  externalSignal?: AbortSignal
): Promise<FetchProductResult> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) {
    return { found: false, error: 'Code-barres invalide' };
  }

  // 1. Check local offline cache first
  const cache = getCachedProducts();
  if (cache[cleanBarcode]) {
    return {
      found: true,
      product: { ...cache[cleanBarcode], source: 'local_cache' },
    };
  }

  // 2. Fetch from Open Food Facts API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // If external cancellation requested, abort internal controller
    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timeoutId);
        return { found: false, error: 'Recherche annulée' };
      }
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const response = await fetch(`${OFF_API_BASE}/${encodeURIComponent(cleanBarcode)}.json`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return { found: false };
      }
      return { found: false, error: `Erreur serveur (${response.status})` };
    }

    const data = await response.json();

    if (data.status === 1 && data.product) {
      const p = data.product;
      const rawName = p.product_name_fr || p.product_name || p.generic_name_fr || p.generic_name || '';

      if (!rawName.trim()) {
        return { found: false };
      }

      const { quantity, unit } = parseQuantityString(p.quantity || `${p.product_quantity || ''} ${p.product_quantity_unit || ''}`);

      const productInfo: ProductInfo = {
        barcode: cleanBarcode,
        name: rawName.trim(),
        brand: p.brands ? p.brands.split(',')[0].trim() : undefined,
        quantity: quantity || (typeof p.product_quantity === 'number' ? p.product_quantity : undefined),
        unit: unit,
        category: p.categories ? p.categories.split(',')[0].trim() : undefined,
        imageUrl: p.image_front_small_url || p.image_url || undefined,
        source: 'openfoodfacts',
      };

      // Save to cache for offline retrieval
      saveProductToCache(productInfo);

      return {
        found: true,
        product: productInfo,
      };
    }

    return { found: false };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const isOffline = !navigator.onLine;

    return {
      found: false,
      isOffline,
      error: isOffline
        ? 'Appareil hors ligne. Impossible de contacter Open Food Facts.'
        : isAbort
        ? 'Délai d’attente dépassé pour la recherche du produit.'
        : 'Impossible de contacter le service produit.',
    };
  }
}

/**
 * Allows user to manually register or cache product info for subsequent scans.
 */
export function manuallySaveProduct(product: ProductInfo) {
  saveProductToCache({
    ...product,
    source: 'user_manual',
  });
}
