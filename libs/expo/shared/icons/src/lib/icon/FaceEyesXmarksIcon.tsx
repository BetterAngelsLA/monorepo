
import React from 'react';
import FaceEyesXmarksIconSVG from '../svg/face-eyes-xmarks.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceEyesXmarksIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceEyesXmarksIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceEyesXmarksIcon;
  