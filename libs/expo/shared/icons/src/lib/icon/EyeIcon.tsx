
import React from 'react';
import EyeIconSVG from '../svg/eye.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const EyeIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <EyeIconSVG width={w} height={h} fill={colorHex} />;
}

export default EyeIcon;
  