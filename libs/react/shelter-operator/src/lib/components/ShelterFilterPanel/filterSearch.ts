export type FilterOption = { id: string; label: string };

/**
 * Returns visible chip options for a section, or null if the section should hide.
 * - No search → all options (null if empty)
 * - Header matches search → all options
 * - Else → label-filtered options (null if none match)
 */
export function getVisibleOptions(
  header: string,
  options: FilterOption[],
  search: string,
): FilterOption[] | null {
  if (!search) {
    return options.length > 0 ? options : null;
  }
  if (header.toLowerCase().includes(search)) {
    return options.length > 0 ? options : null;
  }
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search),
  );
  return filtered.length > 0 ? filtered : null;
}

/**
 * Header/alias match for sections without searchable option labels
 * (dropdowns, booleans, scalar inputs).
 */
export function headerMatches(
  header: string,
  search: string,
  searchTerms: string[] = [],
): boolean {
  if (!search) return true;
  const candidates = [header, ...searchTerms].map((s) => s.toLowerCase());
  return candidates.some((c) => c.includes(search));
}
