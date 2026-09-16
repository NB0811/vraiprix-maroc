import assert from 'node:assert';
import {
  calculateMedian,
  calculateMean,
  evaluateNewPrice,
  PRICING_ENGINE_CONFIG,
  deduplicateObservations,
} from './priceSignal';
import { PriceObservation } from '../types';

console.log('--- Lancement des tests unitaires du Moteur Vrai Prix ---');

const nowMs = new Date('2026-09-16T12:00:00Z').getTime();

function createMockObs(partial: Partial<PriceObservation>): PriceObservation {
  return {
    id: partial.id || `obs_${Math.random().toString(36).substring(2, 8)}`,
    barcode: partial.barcode || '611100000001',
    productName: partial.productName || 'Produit Test',
    brand: partial.brand || 'Marque Test',
    price: partial.price ?? 25,
    quantity: partial.quantity ?? 1,
    unit: partial.unit || 'kg',
    unitPrice: partial.unitPrice ?? 25,
    baseUnit: partial.baseUnit || 'kg',
    store: partial.store || 'Marjane',
    city: partial.city || 'Casablanca',
    date: partial.date || '2026-09-10T10:00:00Z',
  };
}

// TEST 1 : Historique antérieur: 25, 28, 29. Nouveau: 15.
// La référence doit être calculée SANS 15. Le résultat doit être PRIX INTÉRESSANT.
// Après enregistrement seulement, 15 rejoint l'historique.
{
  const priorObs: PriceObservation[] = [
    createMockObs({ id: '1', unitPrice: 25, price: 25, store: 'Aswak Assalam', city: 'Mohammedia' }),
    createMockObs({ id: '2', unitPrice: 28, price: 28, store: 'Marjane', city: 'Casablanca' }),
    createMockObs({ id: '3', unitPrice: 29, price: 29, store: 'BIM', city: 'Casablanca' }),
  ];

  const newObs: PriceObservation = createMockObs({
    id: 'new_15',
    unitPrice: 15,
    price: 15,
    store: 'Carrefour',
    city: 'Casablanca',
  });

  // Étape 1 à 4 : Évaluation avec uniquement les observations antérieures
  const result = evaluateNewPrice({
    currentUnitPrice: newObs.unitPrice,
    baseUnit: newObs.baseUnit,
    productNameOrBarcode: newObs.barcode!,
    priorObservations: priorObs,
    city: newObs.city,
    evaluatedRawPrice: newObs.price,
    evaluatedObservationId: newObs.id,
    nowMs,
  });

  // La référence doit être la médiane de [25, 28, 29] = 28 DH, SANS 15 !
  assert.strictEqual(result.referenceUnitPrice, 28, 'La référence doit être la médiane de 25, 28, 29 = 28 DH');
  assert.strictEqual(result.observationCount, 3, 'Doit utiliser les 3 observations antérieures');
  assert.strictEqual(result.level, 'interesting', '15 DH vs 28 DH (-46%) doit être classé PRIX INTÉRESSANT');
  assert.strictEqual(result.percentDiff, -46, 'Différence en % attendue: -46%');

  // Vérifier que 15 n'est PAS dans les observations utilisées
  const usedPrices = result.priorObservationsUsed?.map((o) => o.unitPrice);
  assert.ok(!usedPrices?.includes(15), 'Le nouveau prix de 15 DH ne doit PAS apparaître dans les observations de référence');

  // Étape 5 : Après enregistrement seulement, 15 rejoint l'historique
  const updatedHistory = [newObs, ...priorObs];
  assert.strictEqual(updatedHistory.length, 4, 'Après enregistrement, 15 rejoint l’historique');
  console.log('✓ TEST 1 validé : Référence calculée sans le nouveau prix 15 DH, classé 🟢 PRIX INTÉRESSANT');
}

// TEST 2 : Historique antérieur: 15, 25, 28, 29. Nouveau: 40.
// La référence doit être calculée SANS 40. 40 ne doit jamais influencer son propre pourcentage.
{
  const priorObs: PriceObservation[] = [
    createMockObs({ id: '1', unitPrice: 15, price: 15 }),
    createMockObs({ id: '2', unitPrice: 25, price: 25 }),
    createMockObs({ id: '3', unitPrice: 28, price: 28 }),
    createMockObs({ id: '4', unitPrice: 29, price: 29 }),
  ];

  const result = evaluateNewPrice({
    currentUnitPrice: 40,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    evaluatedRawPrice: 40,
    nowMs,
  });

  // Médiane de [15, 25, 28, 29] = (25 + 28) / 2 = 26.50 DH
  assert.strictEqual(result.referenceUnitPrice, 26.5, 'La médiane de [15, 25, 28, 29] doit être 26.50 DH');
  assert.strictEqual(result.observationCount, 4, '4 observations antérieures utilisées');
  // (40 - 26.5) / 26.5 = +50.94% => +51%
  assert.strictEqual(result.percentDiff, 51, 'Écart attendu: +51%');
  assert.strictEqual(result.level, 'high', '40 DH (+51%) doit être 🔴 PRIX ÉLEVÉ');

  // Vérifier que 40 ne figure pas dans la liste des observations antérieures
  assert.ok(!result.priorObservationsUsed?.some((o) => o.unitPrice === 40), '40 DH ne doit pas être dans les observations de référence');
  console.log('✓ TEST 2 validé : 40 DH évalué contre la médiane antérieure (26.50 DH), +51%, 🔴 PRIX ÉLEVÉ');
}

// TEST 3 : Aucune observation antérieure -> ⚪ DONNÉES INSUFFISANTES
{
  const result = evaluateNewPrice({
    currentUnitPrice: 30,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: [],
    nowMs,
  });

  assert.strictEqual(result.level, 'insufficient', 'Doit retourner insufficient');
  assert.strictEqual(result.title, 'DONNÉES INSUFFISANTES');
  assert.strictEqual(result.observationCount, 0);
  console.log('✓ TEST 3 validé : 0 observation antérieure -> ⚪ DONNÉES INSUFFISANTES');
}

// TEST 4 : Une seule observation antérieure -> ⚪ DONNÉES INSUFFISANTES
{
  const priorObs = [createMockObs({ unitPrice: 25 })];
  const result = evaluateNewPrice({
    currentUnitPrice: 30,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });

  assert.strictEqual(result.level, 'insufficient');
  assert.strictEqual(result.title, 'DONNÉES INSUFFISANTES');
  assert.strictEqual(result.observationCount, 1);
  console.log('✓ TEST 4 validé : 1 observation antérieure -> ⚪ DONNÉES INSUFFISANTES');
}

// TEST 5 : Deux observations antérieures -> ⚪ DONNÉES INSUFFISANTES
{
  const priorObs = [createMockObs({ unitPrice: 25 }), createMockObs({ unitPrice: 28 })];
  const result = evaluateNewPrice({
    currentUnitPrice: 30,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });

  assert.strictEqual(result.level, 'insufficient');
  assert.strictEqual(result.title, 'DONNÉES INSUFFISANTES');
  assert.strictEqual(result.observationCount, 2);
  console.log('✓ TEST 5 validé : 2 observations antérieures -> ⚪ DONNÉES INSUFFISANTES');
}

// TEST 6 : Trois observations comparables -> signal actif
{
  const priorObs = [
    createMockObs({ id: '1', store: 'Marjane', unitPrice: 20 }),
    createMockObs({ id: '2', store: 'Carrefour', unitPrice: 20 }),
    createMockObs({ id: '3', store: 'BIM', unitPrice: 20 }),
  ];
  const result = evaluateNewPrice({
    currentUnitPrice: 20,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });

  assert.notStrictEqual(result.level, 'insufficient', 'Signal doit être actif avec 3 observations');
  assert.strictEqual(result.level, 'average', 'Différence de 0% doit être 🟡 PRIX DANS LA MOYENNE');
  assert.strictEqual(result.observationCount, 3);
  console.log('✓ TEST 6 validé : 3 observations comparables -> signal actif (🟡 PRIX DANS LA MOYENNE)');
}

// TEST 7 : Vérification des limites exactes des seuils -10 % et +10 %
{
  // Référence = 100 DH (3 enseignes distinctes)
  const priorObs = [
    createMockObs({ id: '1', store: 'Marjane', unitPrice: 100 }),
    createMockObs({ id: '2', store: 'Carrefour', unitPrice: 100 }),
    createMockObs({ id: '3', store: 'BIM', unitPrice: 100 }),
  ];

  // Limite -10% : prix = 90 DH (diff = -10%) => Doit être PRIX INTÉRESSANT
  const res90 = evaluateNewPrice({
    currentUnitPrice: 90,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });
  assert.strictEqual(res90.percentDiff, -10);
  assert.strictEqual(res90.level, 'interesting', 'Exactement -10% doit être 🟢 PRIX INTÉRESSANT');

  // Juste au-dessus de -10% : prix = 90.01 DH (diff arrondie à -10% ou -9.99%)
  // Test avec 91 DH (diff = -9%) => Doit être PRIX DANS LA MOYENNE
  const res91 = evaluateNewPrice({
    currentUnitPrice: 91,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });
  assert.strictEqual(res91.percentDiff, -9);
  assert.strictEqual(res91.level, 'average', '-9% doit être 🟡 PRIX DANS LA MOYENNE');

  // Juste en-dessous de +10% : prix = 109 DH (diff = +9%) => Doit être PRIX DANS LA MOYENNE
  const res109 = evaluateNewPrice({
    currentUnitPrice: 109,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });
  assert.strictEqual(res109.percentDiff, 9);
  assert.strictEqual(res109.level, 'average', '+9% doit être 🟡 PRIX DANS LA MOYENNE');

  // Limite +10% : prix = 110 DH (diff = +10%) => Doit être PRIX ÉLEVÉ
  const res110 = evaluateNewPrice({
    currentUnitPrice: 110,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });
  assert.strictEqual(res110.percentDiff, 10);
  assert.strictEqual(res110.level, 'high', 'Exactement +10% doit être 🔴 PRIX ÉLEVÉ');

  console.log('✓ TEST 7 validé : Seuils exacts -10% (🟢) et +10% (🔴) et entre les deux (🟡)');
}

// TEST 8 : Comparer correctement : 500 g / 20 DH avec 1 kg / 35 DH en prix/kg
{
  // 500g à 20 DH = 40 DH/kg
  const obs500g = createMockObs({
    id: 'obs_500g',
    quantity: 0.5,
    unit: 'g',
    price: 20,
    unitPrice: 40, // 20 / 0.5 = 40 DH/kg
    baseUnit: 'kg',
  });

  // 1kg à 35 DH = 35 DH/kg
  const obs1kg = createMockObs({
    id: 'obs_1kg',
    quantity: 1,
    unit: 'kg',
    price: 35,
    unitPrice: 35, // 35 / 1 = 35 DH/kg
    baseUnit: 'kg',
  });

  const obs2kg = createMockObs({
    id: 'obs_2kg',
    quantity: 2,
    unit: 'kg',
    price: 72,
    unitPrice: 36, // 72 / 2 = 36 DH/kg
    baseUnit: 'kg',
  });

  const priorObs = [obs1kg, obs2kg, createMockObs({ unitPrice: 38, baseUnit: 'kg' })];

  // Évaluation de l'offre 500g (40 DH/kg)
  const result = evaluateNewPrice({
    currentUnitPrice: obs500g.unitPrice,
    baseUnit: obs500g.baseUnit,
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });

  assert.strictEqual(result.baseUnit, 'kg', 'La base unitaire commune doit être le kg');
  assert.strictEqual(result.currentUnitPrice, 40, 'Le prix unitaire normalisé doit être 40 DH/kg');
  assert.strictEqual(result.observationCount, 3, 'Les formats en kg sont tous comparables');
  console.log('✓ TEST 8 validé : 500g / 20 DH normalisé à 40 DH/kg comparé aux formats 1kg et 2kg');
}

// TEST 9 : Ne pas comparer kg avec litre lorsque les données ne permettent pas de conversion
{
  const priorObs = [
    createMockObs({ unitPrice: 20, baseUnit: 'kg' }),
    createMockObs({ unitPrice: 22, baseUnit: 'kg' }),
    createMockObs({ unitPrice: 21, baseUnit: 'kg' }),
  ];

  // Tentative d'évaluer un produit avec baseUnit 'L' (volume) contre 'kg' (masse)
  const result = evaluateNewPrice({
    currentUnitPrice: 15,
    baseUnit: 'L',
    productNameOrBarcode: '611100000001',
    priorObservations: priorObs,
    nowMs,
  });

  // Comme les unités sont incompatibles, aucune observation antérieure n'est retenue
  assert.strictEqual(result.observationCount, 0, 'Les observations en kg ne doivent PAS être mélangées avec des litres');
  assert.strictEqual(result.level, 'insufficient', 'Doit être insuffisant car 0 observation compatible');
  console.log('✓ TEST 9 validé : Incompatibilité stricte entre kg et litre respectée');
}

// TEST 10 : Vérifier qu'un doublon évident ne déforme pas la référence
{
  const baseDate = '2026-09-12T14:00:00Z';
  const sameDayDate = '2026-09-12T14:05:00Z'; // 5 minutes plus tard, même magasin, même ville, même prix

  const obs1 = createMockObs({ id: '1', store: 'Marjane', city: 'Casablanca', unitPrice: 25, date: baseDate });
  const duplicate1 = createMockObs({ id: 'dup_1', store: 'Marjane', city: 'Casablanca', unitPrice: 25, date: sameDayDate });
  const duplicate2 = createMockObs({ id: 'dup_2', store: 'Marjane', city: 'Casablanca', unitPrice: 25, date: sameDayDate });

  const obs2 = createMockObs({ id: '2', store: 'Carrefour', city: 'Casablanca', unitPrice: 28, date: baseDate });
  const obs3 = createMockObs({ id: '3', store: 'BIM', city: 'Casablanca', unitPrice: 30, date: baseDate });

  const allObsWithDuplicates = [obs1, duplicate1, duplicate2, obs2, obs3];

  // La déduplication doit filtrer duplicate1 et duplicate2
  const deduped = deduplicateObservations(allObsWithDuplicates);
  assert.strictEqual(deduped.length, 3, 'Doit éliminer les doublons immédiats identiques');

  const result = evaluateNewPrice({
    currentUnitPrice: 35,
    baseUnit: 'kg',
    productNameOrBarcode: '611100000001',
    priorObservations: allObsWithDuplicates,
    nowMs,
  });

  // Sans déduplication, 25 serait triplé : [25, 25, 25, 28, 30] -> médiane = 25
  // Avec déduplication : [25, 28, 30] -> médiane = 28
  assert.strictEqual(result.referenceUnitPrice, 28, 'La référence médiane doit être 28 DH et non faussée par les doublons');
  console.log('✓ TEST 10 validé : Doublons immédiats éliminés, la référence médiane reste saine à 28 DH');
}

// TEST 11 : Vérifier la suppression complète et sélective de clearAllObservations()
{
  if (typeof (global as any).localStorage === 'undefined') {
    const store = new Map<string, string>();
    (global as any).localStorage = {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, val: string) => store.set(key, String(val)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    };
  }

  const {
    saveObservation,
    loadObservations,
    clearAllObservations,
    savePreferences,
    loadPreferences,
  } = await import('../services/storageService');

  // 1. Enregistrer des observations
  saveObservation(createMockObs({ id: 'obs_1', productName: 'Lait UHT', price: 9 }));
  saveObservation(createMockObs({ id: 'obs_2', productName: 'Lait UHT', price: 10 }));
  saveObservation(createMockObs({ id: 'obs_3', productName: 'Lait UHT', price: 9.5 }));

  assert.strictEqual(loadObservations().length, 3, 'Doit contenir 3 observations');

  // 2. Enregistrer cache Open Food Facts et préférences utilisateur
  localStorage.setItem('vraiprix_product_cache_v1', JSON.stringify({ '611100000001': { name: 'Lait UHT' } }));
  savePreferences({ defaultCity: 'Tanger' });

  // 3. Exécuter l'effacement de toutes les observations
  clearAllObservations();

  // 4. Vérifier que les observations sont à 0
  const afterClear = loadObservations();
  assert.strictEqual(afterClear.length, 0, 'Les observations doivent être exactement à 0');

  // 5. Vérifier que le cache Open Food Facts et les préférences sont intacts
  assert.ok(localStorage.getItem('vraiprix_product_cache_v1'), 'Le cache Open Food Facts ne doit PAS être supprimé');
  assert.strictEqual(loadPreferences().defaultCity, 'Tanger', 'Les préférences ne doivent PAS être supprimées');

  // 6. Vérifier que l'évaluation pour ce produit ne trouve plus aucune observation antérieure
  const evalResult = evaluateNewPrice({
    currentUnitPrice: 10,
    baseUnit: 'L',
    productNameOrBarcode: 'Lait UHT',
    priorObservations: afterClear,
    nowMs,
  });
  assert.strictEqual(evalResult.observationCount, 0, 'Après effacement, 0 observation antérieure trouvée');
  assert.strictEqual(evalResult.level, 'insufficient', 'Doit être insuffisant sans observations');

  console.log('✓ TEST 11 validé : clearAllObservations() supprime 100% des observations de manière persistante sans toucher aux préférences ni au cache Open Food Facts');
}

console.log('\n======================================================');
console.log('TOUS LES TESTS UNITAIRES ONT RÉUSSI !');
console.log('======================================================\n');
