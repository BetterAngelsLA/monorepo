
import React from 'react';
import FaceRelievedIconSVG from '../svg/face-relieved.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceRelievedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceRelievedIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceRelievedIcon;
  