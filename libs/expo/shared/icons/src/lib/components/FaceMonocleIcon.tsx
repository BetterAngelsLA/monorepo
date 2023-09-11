
import React from 'react';
import FaceMonocleIconSVG from '../svg/face-monocle.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceMonocleIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceMonocleIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceMonocleIcon;
  