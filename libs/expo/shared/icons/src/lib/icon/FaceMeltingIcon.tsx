
import React from 'react';
import FaceMeltingIconSVG from '../svg/face-melting.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceMeltingIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceMeltingIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceMeltingIcon;
  