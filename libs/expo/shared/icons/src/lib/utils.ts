import { ICON_SIZE } from './constant';
import { IconColors, IconSizes } from './types';

export const extractSize = (size: IconSizes): { h: number; w: number } => {
  return ICON_SIZE[size];
};

export const extractColor = (color: IconColors): string => {
  // TODO: AK Once color names are finalized, add logic here to parse colors and add types
  return color;
};
