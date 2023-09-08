import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IIconProps } from './types';
import { extractSize } from './utils';

const UpArrowLongIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { h, w } = extractSize(size);
  return (
    <Svg width={w} height={h} viewBox="0 0 384 512">
      <Path
        fill={color}
        d="M209 17L192 0l-17 17L39 153l-17 17 34 33.9 17-17 95-95V512h48V91.9l95 95 17 17 33.9-33.9-17-17L209 17z"
      ></Path>
    </Svg>
  );
};

export default UpArrowLongIcon;
