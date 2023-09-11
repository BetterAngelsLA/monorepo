
import React from 'react';
import PlusIconSVG from '../svg/plus.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const PlusIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <PlusIconSVG width={w} height={h} fill={colorHex} />;
}

export default PlusIcon;
  