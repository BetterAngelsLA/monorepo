
import React from 'react';
import FlagSwallowtailIconSVG from '../svg/flag-swallowtail.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FlagSwallowtailIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FlagSwallowtailIconSVG width={w} height={h} fill={colorHex} />;
}

export default FlagSwallowtailIcon;
  