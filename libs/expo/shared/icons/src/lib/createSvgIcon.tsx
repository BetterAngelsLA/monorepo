import { memo } from 'react';
import { SvgProps } from 'react-native-svg';
import { IIconProps } from './types';
import { extractSize } from './utils';

// Higher Order Component to create SVG icons
const createSvgIcon = (SvgComponent: React.ComponentType<SvgProps>) => {
  const IconComponent: React.FC<IIconProps> = ({
    size = 'md',
    color = '#ffffff',
    rotate = '0deg',
    ...props // we should avoid passing all props
  }) => {
    const { w, h } = extractSize(size);
    return (
      <SvgComponent
        style={{ transform: [{ rotate }] }}
        width={w}
        height={h}
        fill={color}
        {...props}
      />
    );
  };
  return memo(IconComponent);
};

export default createSvgIcon;
