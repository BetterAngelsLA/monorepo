
import React from 'react';
import FaceSmileTearIconSVG from '../svg/face-smile-tear.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceSmileTearIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSmileTearIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceSmileTearIcon;
  