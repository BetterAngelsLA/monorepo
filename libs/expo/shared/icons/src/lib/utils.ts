import { ICON_SIZE } from './constant';
import { TIconColors, TIconSize } from './types';

export const extractSize = (size: TIconSize): { h: number; w: number } => {
  return ICON_SIZE[size];
};

export const extractColor = (color: TIconColors) => {
  // TODO: AK Once color names are finalized, add logic here to parse colors and add types
  return color;
};
