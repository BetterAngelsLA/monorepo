
import React from 'react';
import FileIconSVG from '../svg/file.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FileIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FileIconSVG width={w} height={h} fill={colorHex} />;
}

export default FileIcon;
  