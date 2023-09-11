
import React from 'react';
import ArrowLeftIconSVG from '../svg/arrow-left.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ArrowLeftIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowLeftIconSVG width={w} height={h} fill={colorHex} />;
}

export default ArrowLeftIcon;
  