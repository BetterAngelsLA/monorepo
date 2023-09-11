
import React from 'react';
import MapIconSVG from '../svg/map.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const MapIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <MapIconSVG width={w} height={h} fill={colorHex} />;
}

export default MapIcon;
  