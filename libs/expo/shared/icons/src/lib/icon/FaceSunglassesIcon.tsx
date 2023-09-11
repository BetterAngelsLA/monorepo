
import React from 'react';
import FaceSunglassesIconSVG from '../svg/face-sunglasses.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceSunglassesIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSunglassesIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceSunglassesIcon;
  