export interface IIconProps {
  size?: TIconSizes;
  color?: string;
  rotate?: string;
  mb?: TSpacing;
  mt?: TSpacing;
  my?: TSpacing;
  mx?: TSpacing;
  ml?: TSpacing;
  mr?: TSpacing;
}

type TSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type TIconSizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// TODO: AK type color strings here once they are available
export type TIconColors = 'white';
