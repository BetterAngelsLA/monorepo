
import React from 'react';
import VideoIconSVG from '../svg/video.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const VideoIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <VideoIconSVG width={w} height={h} fill={colorHex} />;
}

export default VideoIcon;
  