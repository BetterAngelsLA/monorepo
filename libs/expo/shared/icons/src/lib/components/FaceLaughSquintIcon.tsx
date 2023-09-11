
import React from 'react';
import FaceLaughSquintIconSVG from '../svg/face-laugh-squint.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceLaughSquintIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceLaughSquintIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceLaughSquintIcon;
  