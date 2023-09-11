
import React from 'react';
import FaceHandYawnIconSVG from '../svg/face-hand-yawn.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceHandYawnIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceHandYawnIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceHandYawnIcon;
  