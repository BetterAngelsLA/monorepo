
import React from 'react';
import NoteIconSVG from '../svg/note.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const NoteIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <NoteIconSVG width={w} height={h} fill={colorHex} />;
}

export default NoteIcon;
  