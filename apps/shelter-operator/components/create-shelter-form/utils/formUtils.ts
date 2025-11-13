/**
 * Toggle a string value within a string array, returning a new array instance.
 */
export const toggleStringValue = (current: readonly string[], value: string): string[] => {
  return current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value];
};

/**
 * Convert an option identifier into a human-readable label.
 * Falls back to the original value when no formatting is needed.
 */
export const toDisplayLabel = (value: string): string => {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b(\w)/g, match => match.toUpperCase());
};

export const mapToCheckboxOptions = (options: readonly string[]) =>
  options.map(option => ({
    value: option,
    label: toDisplayLabel(option),
  }));
