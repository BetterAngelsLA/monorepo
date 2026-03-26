/**
 * Maps lookup items with a `name` enum to display strings. If `otherKey` is
 * present in the list, the enum label is omitted and `otherText` is appended
 * once at the end (when `otherText != null`).
 */
export function displayListWithOther<
  TEnum extends string,
  TItem extends { name?: TEnum | null }
>(
  items: readonly TItem[] | null | undefined,
  otherText: string | null | undefined,
  displayMap: Record<TEnum, string>,
  otherKey: TEnum
): string[] {
  const list = items ?? [];
  const hasOther = list.some((item) => item.name === otherKey);

  const labels = list
    .map((item) => {
      if (!item.name || item.name === otherKey) return null;
      return displayMap[item.name];
    })
    .filter((label): label is string => Boolean(label));

  if (hasOther && otherText != null) {
    labels.push(otherText);
  }

  return labels;
}
