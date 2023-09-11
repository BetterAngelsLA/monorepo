
import React from 'react';
import FaceDisappointedIconSVG from '../svg/face-disappointed.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceDisappointedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceDisappointedIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceDisappointedIcon;
  