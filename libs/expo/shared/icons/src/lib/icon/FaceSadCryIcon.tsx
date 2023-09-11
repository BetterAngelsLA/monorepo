
import React from 'react';
import FaceSadCryIconSVG from '../svg/face-sad-cry.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceSadCryIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSadCryIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceSadCryIcon;
  