
import React from 'react';
import ArrowRightFromArcIconSVG from '../svg/arrow-right-from-arc.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ArrowRightFromArcIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowRightFromArcIconSVG width={w} height={h} fill={colorHex} />;
}

export default ArrowRightFromArcIcon;
  