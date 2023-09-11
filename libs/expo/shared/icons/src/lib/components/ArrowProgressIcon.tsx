
import React from 'react';
import ArrowProgressIconSVG from '../svg/arrow-progress.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ArrowProgressIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowProgressIconSVG width={w} height={h} fill={colorHex} />;
}

export default ArrowProgressIcon;
  