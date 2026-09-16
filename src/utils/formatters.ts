/**
 * Formats a numerical amount to Moroccan Dirham (MAD / DH).
 */
export function formatDH(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0.00 DH';
  }
  return `${amount.toLocaleString('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DH`;
}

/**
 * Formats a unit price e.g. "32.50 DH/kg".
 */
export function formatUnitPrice(unitPrice: number, baseUnit: 'kg' | 'L' | 'unite'): string {
  return `${formatDH(unitPrice)}/${baseUnit === 'unite' ? 'unité' : baseUnit}`;
}

/**
 * Human-friendly date representation in French.
 */
export function formatDateRelative(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;

    return d.toLocaleDateString('fr-MA', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateString;
  }
}
