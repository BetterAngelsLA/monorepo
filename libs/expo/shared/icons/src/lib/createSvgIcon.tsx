import { IIconProps } from './types';
import { extractColor, extractSize } from './utils';

// Higher Order Component to create SVG icons
const createSvgIcon = (SvgComponent: React.ComponentType<any>) => {
  return ({ size = 'md', color = 'black' }: IIconProps) => {
    const { w, h } = extractSize(size);
    const colorHex = extractColor(color);
    return <SvgComponent width={w} height={h} fill={colorHex} />;
  };
};

export default createSvgIcon;
