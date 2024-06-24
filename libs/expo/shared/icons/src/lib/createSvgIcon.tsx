import { Spacings } from '@monorepo/expo/shared/static';
import { memo } from 'react';
import { SvgProps } from 'react-native-svg';
import { IIconProps } from './types';
import { extractSize } from './utils';

interface ExtendedIconProps extends IIconProps {
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}

// Higher Order Component to create SVG icons
const createSvgIcon = (SvgComponent: React.ComponentType<SvgProps>) => {
  const IconComponent: React.FC<ExtendedIconProps> = ({
    size = 'md',
    color = '#ffffff',
    rotate = '0deg',
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
    strokeWidth = 1,
    strokeColor,
    fillColor,
    ...props
  }) => {
    const { w, h } = extractSize(size);

    const style = {
      transform: [{ rotate }],
      marginBottom: mb ? Spacings[mb] : undefined,
      marginTop: mt ? Spacings[mt] : undefined,
      marginLeft: ml ? Spacings[ml] : undefined,
      marginRight: mr ? Spacings[mr] : undefined,
      marginHorizontal: mx ? Spacings[mx] : undefined,
      marginVertical: my ? Spacings[my] : undefined,
    };

    return (
      <SvgComponent
        width={w}
        height={h}
        style={style}
        stroke={strokeColor || color}
        strokeWidth={strokeWidth}
        fill={fillColor || color}
        {...props}
      />
    );
  };

  return memo(IconComponent);
};

export default createSvgIcon;
