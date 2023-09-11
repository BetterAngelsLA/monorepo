
import React from 'react';
import ShowerIconSVG from '../svg/shower.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ShowerIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ShowerIconSVG width={w} height={h} fill={colorHex} />;
}

export default ShowerIcon;
  