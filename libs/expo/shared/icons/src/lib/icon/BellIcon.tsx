
import React from 'react';
import BellIconSVG from '../svg/bell.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const BellIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BellIconSVG width={w} height={h} fill={colorHex} />;
}

export default BellIcon;
  