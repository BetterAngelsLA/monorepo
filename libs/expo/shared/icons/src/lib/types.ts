import { ICON_SIZE } from './constant';

export interface IIconProps {
  size?: TIconSize | number;
  width?: number;
  height?: number;
  color?: string;
  rotate?: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

type TSpacing = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TIconSize = keyof typeof ICON_SIZE;

// TODO: AK type color strings here once they are available
export type TIconColors = 'white';
