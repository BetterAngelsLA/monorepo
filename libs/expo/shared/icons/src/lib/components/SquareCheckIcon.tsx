
import React from 'react';
import SquareCheckIconSVG from '../svg/square-check.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const SquareCheckIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <SquareCheckIconSVG width={w} height={h} fill={colorHex} />;
}

export default SquareCheckIcon;
  