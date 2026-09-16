import { PriceObservation, UserPreferences } from '../types';

const OBSERVATIONS_KEY = 'vraiprix_observations_v1';
const PREFERENCES_KEY = 'vraiprix_preferences_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultCity: 'Casablanca',
  defaultStore: 'Marjane',
  soundEnabled: true,
  hapticsEnabled: true,
  theme: 'light',
  hasSeenOnboarding: false,
};

/**
 * Retrieves all stored price observations from localStorage.
 */
export function getStoredObservations(): PriceObservation[] {
  try {
    const raw = localStorage.getItem(OBSERVATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading stored observations', e);
    return [];
  }
}

/**
 * Saves or prepends a new price observation.
 */
export function saveObservation(observation: PriceObservation): PriceObservation[] {
  const current = getStoredObservations();
  // Ensure unique ID
  const updated = [observation, ...current.filter((o) => o.id !== observation.id)];
  try {
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving observation', e);
  }
  return updated;
}

/**
 * Updates an existing observation.
 */
export function updateObservation(
  id: string,
  changes: Partial<PriceObservation>
): PriceObservation[] {
  const current = getStoredObservations();
  const updated = current.map((item) => (item.id === id ? { ...item, ...changes } : item));
  try {
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error updating observation', e);
  }
  return updated;
}

/**
 * Deletes an observation by ID.
 */
export function deleteObservation(id: string): PriceObservation[] {
  const current = getStoredObservations();
  const updated = current.filter((o) => o.id !== id);
  try {
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting observation', e);
  }
  return updated;
}

/**
 * Reads user preferences.
 */
export function getUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Saves updated user preferences.
 */
export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const current = getUserPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving preferences', e);
  }
  return updated;
}

/**
 * Exports all user data into a JSON string for portable backups.
 */
export function exportBackupJSON(): string {
  const data = {
    appName: 'VraiPrix Maroc',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    observations: getStoredObservations(),
    preferences: getUserPreferences(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Imports observations and preferences from JSON backup.
 */
export function importBackupJSON(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.observations)) {
      return { success: false, count: 0, error: 'Format de fichier de sauvegarde non valide.' };
    }

    const currentObs = getStoredObservations();
    const mergedObsMap = new Map<string, PriceObservation>();

    // Add current
    currentObs.forEach((o) => mergedObsMap.set(o.id, o));
    // Add imported
    parsed.observations.forEach((o: PriceObservation) => {
      if (o.id && o.productName && typeof o.price === 'number') {
        mergedObsMap.set(o.id, o);
      }
    });

    const newObsList = Array.from(mergedObsMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(newObsList));

    if (parsed.preferences) {
      saveUserPreferences(parsed.preferences);
    }

    return { success: true, count: parsed.observations.length };
  } catch {
    return { success: false, count: 0, error: 'Erreur lors de la lecture du fichier JSON.' };
  }
}

/**
 * Clears all user observations permanently from localStorage.
 * Does NOT delete Open Food Facts product cache, user preferences, or app settings.
 */
export function clearAllObservations(): void {
  try {
    localStorage.removeItem(OBSERVATIONS_KEY);
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Error clearing observations', e);
  }
}

/**
 * Clears all user observations (kept for backward compatibility).
 */
export function clearAllLocalData(): void {
  clearAllObservations();
}

export const loadObservations = getStoredObservations;
export const loadPreferences = getUserPreferences;
export const savePreferences = saveUserPreferences;
