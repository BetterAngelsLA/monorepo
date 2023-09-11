
import React from 'react';
import FaceSadTearIconSVG from '../svg/face-sad-tear.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceSadTearIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSadTearIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceSadTearIcon;
  