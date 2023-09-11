
import React from 'react';
import FaceWearyIconSVG from '../svg/face-weary.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceWearyIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceWearyIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceWearyIcon;
  