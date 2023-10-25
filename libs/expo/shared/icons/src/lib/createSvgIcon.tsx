import { memo } from 'react';
import { IIconProps } from './types';
import { extractSize } from './utils';

interface ISVGProps {
  width?: string | number;
  height?: string | number;
  fill?: '#ffffff';
}

// Higher Order Component to create SVG icons
const createSvgIcon = (SvgComponent: React.ComponentType<ISVGProps>) => {
  const IconComponent: React.FC<IIconProps> = ({
    size = 'md',
    color = '#ffffff',
    ...props // we should avoid passing all props
  }) => {
    const { w, h } = extractSize(size);
    return <SvgComponent width={w} height={h} fill={color} {...props} />;
  };
  return memo(IconComponent);
};

export default createSvgIcon;
