
import React from 'react';
import UserIconSVG from '../svg/user.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const UserIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <UserIconSVG width={w} height={h} fill={colorHex} />;
}

export default UserIcon;
  