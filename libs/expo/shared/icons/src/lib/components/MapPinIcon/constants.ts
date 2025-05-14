import { TMapPinIconSize } from './MapPinIcon';

type TWidthHeight = {
  width: number;
  height: number;
};

export const iconSizeMap: Record<TMapPinIconSize, TWidthHeight> = {
  S: {
    width: 25, // 0.6944
    height: 36,
  },
  M: {
    width: 40, // 0.6896
    height: 58,
  },
  L: {
    width: 60, // 0.7059
    height: 85,
  },
};

export const fontSizeMap: Record<TMapPinIconSize, number> = {
  S: 14,
  M: 20,
  L: 32,
};

export const withSubscriptFontSizeMultiplier = 0.9375;
export const subscriptAfterMultiplier = 0.5;
