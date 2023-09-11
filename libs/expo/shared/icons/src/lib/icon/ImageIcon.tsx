
import React from 'react';
import ImageIconSVG from '../svg/image.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const ImageIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ImageIconSVG width={w} height={h} fill={colorHex} />;
}

export default ImageIcon;
  