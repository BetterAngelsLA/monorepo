/**
 * Toggle a value within an array of enum/string choices, returning a new array instance.
 */
export const toggleStringValue = <T extends string>(current: readonly T[], value: T): T[] => {
  return current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value];
};

export const sanitizeString = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export const parseLocation = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const fragments = trimmed.split(',').map(fragment => fragment.trim());
  const [place, latitudeRaw, longitudeRaw] = fragments;
  if (!place) {
    return undefined;
  }

  const latitude = latitudeRaw ? Number(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? Number(longitudeRaw) : undefined;

  return {
    place,
    ...(Number.isFinite(latitude) ? { latitude } : {}),
    ...(Number.isFinite(longitude) ? { longitude } : {}),
  };
};
