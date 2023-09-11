
import React from 'react';
import SyringeIconSVG from '../svg/syringe.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const SyringeIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <SyringeIconSVG width={w} height={h} fill={colorHex} />;
}

export default SyringeIcon;
  