
import React from 'react';
import FaceTissueIconSVG from '../svg/face-tissue.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceTissueIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceTissueIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceTissueIcon;
  