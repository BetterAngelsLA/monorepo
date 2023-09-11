
import React from 'react';
import LocationDotIconSVG from '../svg/location-dot.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const LocationDotIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <LocationDotIconSVG width={w} height={h} fill={colorHex} />;
}

export default LocationDotIcon;
  