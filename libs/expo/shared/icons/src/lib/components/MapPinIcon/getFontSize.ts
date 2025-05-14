import { TMapPinIconSize } from './MapPinIcon';
import {
  fontSizeMap,
  subscriptAfterMultiplier,
  withSubscriptFontSizeMultiplier,
} from './constants';

export type TFontsizes = {
  fontSize: number;
  subscriptAfterSize: number;
};

export function getFontSize(
  size: TMapPinIconSize,
  subscriptAfter?: boolean
): TFontsizes {
  const defaultSize = fontSizeMap[size];

  let fontSize = subscriptAfter
    ? defaultSize
    : defaultSize * withSubscriptFontSizeMultiplier;

  return {
    fontSize,
    subscriptAfterSize: fontSize * subscriptAfterMultiplier,
  };
}
