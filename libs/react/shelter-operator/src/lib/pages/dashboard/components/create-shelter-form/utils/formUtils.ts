/**
 * Toggle a value within an array of enum/string choices, returning a new array instance.
 */
export const toggleStringValue = <T extends string>(current: readonly T[], value: T): T[] => {
  return current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value];
};
