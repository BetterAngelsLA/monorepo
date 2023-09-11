
import React from 'react';
import CalendarDaysIconSVG from '../svg/calendar-days.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const CalendarDaysIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <CalendarDaysIconSVG width={w} height={h} fill={colorHex} />;
}

export default CalendarDaysIcon;
  