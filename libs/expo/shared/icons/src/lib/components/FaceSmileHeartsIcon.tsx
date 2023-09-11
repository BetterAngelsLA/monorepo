
import React from 'react';
import FaceSmileHeartsIconSVG from '../svg/face-smile-hearts.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceSmileHeartsIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSmileHeartsIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceSmileHeartsIcon;
  