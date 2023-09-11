
import React from 'react';
import PrescriptionIconSVG from '../svg/prescription.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const PrescriptionIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <PrescriptionIconSVG width={w} height={h} fill={colorHex} />;
}

export default PrescriptionIcon;
  