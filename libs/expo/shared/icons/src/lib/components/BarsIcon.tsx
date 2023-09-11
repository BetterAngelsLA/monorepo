
import React from 'react';
import BarsIconSVG from '../svg/bars.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const BarsIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BarsIconSVG width={w} height={h} fill={colorHex} />;
}

export default BarsIcon;
  