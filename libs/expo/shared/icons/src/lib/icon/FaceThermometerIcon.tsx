
import React from 'react';
import FaceThermometerIconSVG from '../svg/face-thermometer.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceThermometerIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceThermometerIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceThermometerIcon;
  