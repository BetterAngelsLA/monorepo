/** Fixed English collation keeps labels stable across device locale settings. */
export function compareReferralLabels(a: string, b: string): number {
  const order = a.localeCompare(b, 'en-US');
  if (order || a === b) return order;
  return a < b ? -1 : 1;
}
