
import React from 'react';
import FaceLaughBeamIconSVG from '../svg/face-laugh-beam.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceLaughBeamIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceLaughBeamIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceLaughBeamIcon;
  