/** Fixed English collation keeps labels stable across device locale settings. */
export function compareReferralLabels(a: string, b: string): number {
  const order = a.localeCompare(b, 'en-US');
  if (order || a === b) return order;
  return a < b ? -1 : 1;
}

function dateOf(value?: string | number): Date | null {
  if (value === undefined || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Screen dates use the device's local day, consistently in MM/DD/YYYY form. */
export function formatReferralDate(value?: string | number): string {
  return (
    dateOf(value)?.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }) ?? ''
  );
}

export function formatReferralEdited(
  updatedAt?: number,
  now = Date.now(),
): string {
  const date = dateOf(updatedAt);
  if (!date) return '';
  const today = date.toDateString() === new Date(now).toDateString();
  if (today) {
    return ` · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return ` · ${formatReferralDate(updatedAt)}`;
}

/** Exported instants include UTC explicitly; arrival dates stay date-only. */
export function formatReferralTimestamp(value?: string): string {
  const date = dateOf(value);
  if (!date) return 'Not recorded';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}
