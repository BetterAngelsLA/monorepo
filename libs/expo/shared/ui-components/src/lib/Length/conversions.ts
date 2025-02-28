// import { TFeetInches, TLengthUnit } from './types';

export type TLengthUnit = 'inches' | 'feet';

export type TFeetInches = {
  feet: number;
  inches: number;
};

export function inchesToFeetInches(inches: number): TFeetInches {
  return {
    feet: Math.floor(inches / 12),
    inches: Math.round(inches % 12),
  };
}

export const LENGTH_CONVERSIONS: Record<
  TLengthUnit,
  Record<TLengthUnit, (h: number) => number>
> = {
  inches: {
    inches: (h) => h,
    feet: (h) => h / 12,
  },
  feet: {
    inches: (h) => h * 12,
    feet: (h) => h,
  },
};
