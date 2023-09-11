
import React from 'react';
import FaceFrownIconSVG from '../svg/face-frown.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceFrownIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceFrownIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceFrownIcon;
  