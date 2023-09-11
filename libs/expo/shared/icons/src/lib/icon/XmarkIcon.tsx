
import React from 'react';
import XmarkIconSVG from '../svg/xmark.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const XmarkIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <XmarkIconSVG width={w} height={h} fill={colorHex} />;
}

export default XmarkIcon;
  