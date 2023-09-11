
import React from 'react';
import FaceTongueSweatIconSVG from '../svg/face-tongue-sweat.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceTongueSweatIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceTongueSweatIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceTongueSweatIcon;
  