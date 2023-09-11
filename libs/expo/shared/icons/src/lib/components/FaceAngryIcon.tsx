
import React from 'react';
import FaceAngryIconSVG from '../svg/face-angry.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceAngryIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceAngryIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceAngryIcon;
  