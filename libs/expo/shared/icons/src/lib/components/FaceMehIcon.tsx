
import React from 'react';
import FaceMehIconSVG from '../svg/face-meh.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceMehIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceMehIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceMehIcon;
  