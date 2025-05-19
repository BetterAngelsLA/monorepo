import { Colors } from '@monorepo/expo/shared/static';
import { TMapPinIconSize, TMapPinVariant } from './MapPinIcon';

type TVariantStyle = {
  borderColor: Colors;
  fillColor: Colors;
  textColor: Colors;
};

export const variantStyleMap: Record<TMapPinVariant, TVariantStyle> = {
  primary: {
    borderColor: Colors.ERROR,
    fillColor: Colors.WHITE,
    textColor: Colors.ERROR,
  },
  primaryFill: {
    borderColor: Colors.ERROR,
    fillColor: Colors.ERROR,
    textColor: Colors.WHITE,
  },
  secondary: {
    borderColor: Colors.SUCCESS_DARK,
    fillColor: Colors.SUCCESS_DARK,
    textColor: Colors.WHITE,
  },
  secondaryFill: {
    borderColor: Colors.SUCCESS_DARK,
    fillColor: Colors.SUCCESS,
    textColor: Colors.WHITE,
  },
};

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
