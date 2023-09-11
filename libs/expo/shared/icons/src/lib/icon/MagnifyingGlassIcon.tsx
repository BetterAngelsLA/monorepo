
import React from 'react';
import MagnifyingGlassIconSVG from '../svg/magnifying-glass.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const MagnifyingGlassIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <MagnifyingGlassIconSVG width={w} height={h} fill={colorHex} />;
}

export default MagnifyingGlassIcon;
  