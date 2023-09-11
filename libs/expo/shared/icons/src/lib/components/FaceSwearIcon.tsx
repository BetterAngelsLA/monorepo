
import React from 'react';
import FaceSwearIconSVG from '../svg/face-swear.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceSwearIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSwearIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceSwearIcon;
  