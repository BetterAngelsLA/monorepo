
import React from 'react';
import ArrowRightIconSVG from '../svg/arrow-right.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ArrowRightIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowRightIconSVG width={w} height={h} fill={colorHex} />;
}

export default ArrowRightIcon;
  