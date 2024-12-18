import { milesToFeet } from './convert';

type TParams = {
  distance: number;
  units: 'miles' | 'meters';
  minimum?: number | null;
  minimumText?: string;
};

export function formatDistance(params: TParams) {
  const { distance, units, minimum = 0.1, minimumText } = params;

  if (!Number.isFinite(distance)) {
    return null;
  }

  // less than a minimum distance
  if (minimum && distance < minimum) {
    if (minimumText) {
      return minimumText;
    }

    if (units === 'miles') {
      const distanceFeet = milesToFeet(distance);

      const rounded = Math.round(distanceFeet);

      return `${rounded} feet`;
    }
  }

  const rounded = Math.round(distance * 10) / 10;

  return `${rounded} ${units}`;
}
