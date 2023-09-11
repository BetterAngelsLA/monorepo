
import React from 'react';
import PaperclipIconSVG from '../svg/paperclip.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const PaperclipIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <PaperclipIconSVG width={w} height={h} fill={colorHex} />;
}

export default PaperclipIcon;
  