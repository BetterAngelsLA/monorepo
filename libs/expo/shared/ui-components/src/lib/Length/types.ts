export type TLengthUnit = 'inches' | 'feet';

export type TLengthFormat =
  | 'decimal'
  | 'feet-inches-text'
  | 'feet-inches-symbol';

export type TFeetInches = {
  feet: number;
  inches: number;
};
