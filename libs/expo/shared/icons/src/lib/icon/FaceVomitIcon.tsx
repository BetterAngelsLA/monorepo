
import React from 'react';
import FaceVomitIconSVG from '../svg/face-vomit.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceVomitIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceVomitIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceVomitIcon;
  