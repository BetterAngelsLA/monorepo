
import React from 'react';
import FaceNauseatedIconSVG from '../svg/face-nauseated.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FaceNauseatedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceNauseatedIconSVG width={w} height={h} fill={colorHex} />;
}

export default FaceNauseatedIcon;
  