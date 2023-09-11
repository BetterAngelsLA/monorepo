
import React from 'react';
import ToothIconSVG from '../svg/tooth.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ToothIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ToothIconSVG width={w} height={h} fill={colorHex} />;
}

export default ToothIcon;
  