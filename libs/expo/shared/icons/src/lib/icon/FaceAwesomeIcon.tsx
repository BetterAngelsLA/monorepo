
import React from 'react';
import FaceAwesomeIconSVG from '../svg/face-awesome.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceAwesomeIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceAwesomeIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceAwesomeIcon;
  