export const Spacings = {
  xxs: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
} as const;

type SpacingsType = typeof Spacings;

export type TSpacing = keyof SpacingsType;

// asdf
