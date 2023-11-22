import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { IIconProps } from './types';
import { extractSize } from './utils';

interface ISVGProps {
  width?: string | number;
  height?: string | number;
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

// Higher Order Component to create SVG icons
const createSvgIcon = (SvgComponent: React.ComponentType<ISVGProps>) => {
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
