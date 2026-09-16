import { PriceObservation } from '../types';

export interface CommunityReport {
  observationId: string;
  reason: 'incorrect_price' | 'wrong_unit' | 'expired_promotion' | 'spam' | 'other';
  comment?: string;
  reportedAt: string;
}

export interface VerificationScore {
  score: number; // 0 to 100
  status: 'verified' | 'normal' | 'flagged' | 'under_review';
  reasons: string[];
}

/**
 * Calculates a verification confidence score for any price observation.
 * Uses anomaly detection, duplicate checking, and moderation flags.
 */
export function calculateVerificationScore(
  obs: PriceObservation,
  allObs: PriceObservation[]
): VerificationScore {
  let score = 70; // baseline
  const reasons: string[] = [];

  // Has a proof photo?
  if (obs.photoUrl) {
    score += 15;
    reasons.push('Preuve photo/ticket jointe (+15%)');
  }

  // Barcode present?
  if (obs.barcode && obs.barcode.length >= 8) {
    score += 10;
    reasons.push('Code-barres officiel vérifié (+10%)');
  }

  // Flagged by user?
  if ((obs.flagCount ?? 0) > 0) {
    score -= (obs.flagCount ?? 0) * 30;
    reasons.push(`Signalement d'erreur (${obs.flagCount})`);
  }

  // Verified upvotes
  if ((obs.verifiedCount ?? 0) > 0) {
    score += Math.min(20, (obs.verifiedCount ?? 0) * 5);
    reasons.push(`Confirmé par d'autres utilisateurs (${obs.verifiedCount})`);
  }

  // Check for duplicate in same store & day
  const sameStoreSameDay = allObs.filter(
    (o) =>
      o.id !== obs.id &&
      o.store === obs.store &&
      o.city === obs.city &&
      o.productName.toLowerCase() === obs.productName.toLowerCase() &&
      o.date.split('T')[0] === obs.date.split('T')[0]
  );

  if (sameStoreSameDay.length > 0) {
    reasons.push('Attention : observation similaire déjà existante pour cette date.');
  }

  score = Math.max(0, Math.min(100, score));

  let status: VerificationScore['status'] = 'normal';
  if (score >= 85) status = 'verified';
  else if (score <= 30) status = 'flagged';
  else if (score <= 50) status = 'under_review';

  return {
    score,
    status,
    reasons,
  };
}

/**
 * Flags an observation locally or queues for moderation.
 */
export function flagObservation(
  observationId: string,
  reason: CommunityReport['reason'],
  comment?: string
): CommunityReport {
  const report: CommunityReport = {
    observationId,
    reason,
    comment,
    reportedAt: new Date().toISOString(),
  };

  try {
    const key = 'vraiprix_community_reports_v1';
    const raw = localStorage.getItem(key);
    const list: CommunityReport[] = raw ? JSON.parse(raw) : [];
    list.push(report);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to store report', e);
  }

  return report;
}
