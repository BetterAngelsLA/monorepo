import { ICON_SIZE } from './constant';
import { IconSizes } from './types';

export const extractSize = (size: IconSizes): { h: number; w: number } => {
  return ICON_SIZE[size];
};
