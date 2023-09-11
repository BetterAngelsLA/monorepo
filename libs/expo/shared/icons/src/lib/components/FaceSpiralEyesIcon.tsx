
import React from 'react';
import FaceSpiralEyesIconSVG from '../svg/face-spiral-eyes.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceSpiralEyesIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSpiralEyesIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceSpiralEyesIcon;
  