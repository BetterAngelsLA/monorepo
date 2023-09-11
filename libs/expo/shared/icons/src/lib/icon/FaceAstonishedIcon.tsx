
import React from 'react';
import FaceAstonishedIconSVG from '../svg/face-astonished.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceAstonishedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceAstonishedIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceAstonishedIcon;
  