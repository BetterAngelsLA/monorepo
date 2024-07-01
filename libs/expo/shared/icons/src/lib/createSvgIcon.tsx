import { Spacings } from '@monorepo/expo/shared/static';
import { memo } from 'react';
import { SvgProps } from 'react-native-svg';
import { IIconProps } from './types';
import { extractSize } from './utils';

// Higher Order Component to create SVG icons
const createSvgIcon = (
  SvgComponent: React.ComponentType<SvgProps>,
  useStroke = false
) => {
  const IconComponent: React.FC<IIconProps> = ({
    size = 'md',
    color = '#ffffff',
    rotate = '0deg',
    mb,
    mt,
    mr,
    ml,
    my,
    mx,
  }) => {
    let w, h;

    if (typeof size === 'number') {
      w = size;
      h = size;
    } else {
      const extractedSize = extractSize(size);
      w = extractedSize.w;
      h = extractedSize.h;
    }

    return (
      <SvgComponent
        style={{
          transform: [{ rotate }],
          marginBottom: mb && Spacings[mb],
          marginTop: mt && Spacings[mt],
          marginLeft: ml && Spacings[ml],
          marginRight: mr && Spacings[mr],
          marginHorizontal: mx && Spacings[mx],
          marginVertical: my && Spacings[my],
        }}
        width={w}
        height={h}
        color={color}
        {...(useStroke ? { stroke: color } : { fill: color })}
      />
    );
  };
  return memo(IconComponent);
};

export default createSvgIcon;
