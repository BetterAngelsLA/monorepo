
import React from 'react';
import BlanketIconSVG from '../svg/blanket.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const BlanketIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BlanketIconSVG width={w} height={h} fill={colorHex} />;
}

export default BlanketIcon;
  