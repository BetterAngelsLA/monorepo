
import React from 'react';
import MicrophoneIconSVG from '../svg/microphone.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const MicrophoneIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <MicrophoneIconSVG width={w} height={h} fill={colorHex} />;
}

export default MicrophoneIcon;
  