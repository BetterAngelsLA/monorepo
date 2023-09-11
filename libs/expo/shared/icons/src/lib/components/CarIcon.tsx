
import React from 'react';
import CarIconSVG from '../svg/car.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const CarIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <CarIconSVG width={w} height={h} fill={colorHex} />;
}

export default CarIcon;
  