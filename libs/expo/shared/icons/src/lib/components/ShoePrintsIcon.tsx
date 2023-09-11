
import React from 'react';
import ShoePrintsIconSVG from '../svg/shoe-prints.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ShoePrintsIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ShoePrintsIconSVG width={w} height={h} fill={colorHex} />;
}

export default ShoePrintsIcon;
  