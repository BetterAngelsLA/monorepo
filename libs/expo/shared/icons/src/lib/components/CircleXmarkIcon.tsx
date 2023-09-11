
import React from 'react';
import CircleXmarkIconSVG from '../svg/circle-xmark.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const CircleXmarkIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <CircleXmarkIconSVG width={w} height={h} fill={colorHex} />;
}

export default CircleXmarkIcon;
  