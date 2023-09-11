
import React from 'react';
import FileAudioIconSVG from '../svg/file-audio.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const FileAudioIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FileAudioIconSVG width={w} height={h} fill={colorHex} />;
}

export default FileAudioIcon;
  