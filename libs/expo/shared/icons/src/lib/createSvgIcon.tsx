import { memo } from 'react';
import { IIconProps } from './types';
import { extractColor, extractSize } from './utils';

interface ISVGProps {
  width?: string | number;
  height?: string | number;
  fill?: string;
}

// Higher Order Component to create SVG icons
const createSvgIcon = (SvgComponent: React.ComponentType<ISVGProps>) => {
  const IconComponent: React.FC<IIconProps> = ({
    size = 'md',
    color = 'black',
    ...props // we should avoid passing all props
  }) => {
    const { w, h } = extractSize(size);
    const colorHex = extractColor(color);
    return <SvgComponent width={w} height={h} fill={colorHex} {...props} />;
  };
  return memo(IconComponent);
};

export default createSvgIcon;
