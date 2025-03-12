import { TFeetInches, TLengthUnit } from './types';

export const LENGTH_CONVERSIONS: Record<
  TLengthUnit,
  Record<TLengthUnit, (value: number) => number>
> = {
  inches: {
    inches: (value) => value,
    feet: (value) => value / 12,
  },
  feet: {
    inches: (value) => value * 12,
    feet: (value) => value,
  },
};

export function inchesToFeetInches(inches: number): TFeetInches {
  return {
    feet: Math.floor(inches / 12),
    inches: Math.round(inches % 12),
  };
}
