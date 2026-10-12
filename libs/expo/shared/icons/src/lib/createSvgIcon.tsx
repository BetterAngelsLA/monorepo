import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { memo } from 'react';
import { View } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { IIconProps } from './types';
import { extractSize } from './utils';

// Higher Order Component to create SVG icons
const createSvgIcon = (
  SvgComponent: React.ComponentType<SvgProps>,
  useStroke = false,
) => {
  const IconComponent = (props: IIconProps): React.ReactElement => {
    const {
      size = 'md',
      width,
      height,
      color = Colors.PRIMARY_EXTRA_DARK,
      rotate = '0deg',
      mb,
      mt,
      mr,
      ml,
      my,
      mx,
    } = props;
    let w = width;
    let h = height;

    if (typeof size === 'number') {
      w = size;
      h = size;
    } else {
      const extractedSize = extractSize(size);
      w = w || extractedSize.w;
      h = h || extractedSize.h;
    }

    // In the app Metro's react-native-svg-transformer makes an SVG import a component.
    // A test bundler can resolve the same import to an asset id (or URL) instead, and
    // rendering that as a component throws "Element type is invalid". Keep the icon
    // tree mountable by rendering an empty box of the right size in that case.
    if (typeof SvgComponent !== 'function') {
      return <View style={{ width: w, height: h }} />;
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
