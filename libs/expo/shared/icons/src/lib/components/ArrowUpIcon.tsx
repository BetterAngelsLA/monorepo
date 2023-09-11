
import React from 'react';
import ArrowUpIconSVG from '../svg/arrow-up.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ArrowUpIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowUpIconSVG width={w} height={h} fill={colorHex} />;
}

export default ArrowUpIcon;
  