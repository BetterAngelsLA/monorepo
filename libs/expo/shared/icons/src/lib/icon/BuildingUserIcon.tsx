
import React from 'react';
import BuildingUserIconSVG from '../svg/building-user.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const BuildingUserIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BuildingUserIconSVG width={w} height={h} fill={colorHex} />;
}

export default BuildingUserIcon;
  