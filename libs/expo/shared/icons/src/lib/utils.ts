import { ICON_SIZE } from './constant';
import { TIconColors, TIconSizes } from './types';

export const extractSize = (size: TIconSizes): { h: number; w: number } => {
  return ICON_SIZE[size];
};

export const extractColor = (color: TIconColors): string => {
  // TODO: AK Once color names are finalized, add logic here to parse colors and add types
  return color;
};
