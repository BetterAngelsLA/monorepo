
import React from 'react';
import BookOpenIconSVG from '../svg/book-open.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const BookOpenIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BookOpenIconSVG width={w} height={h} fill={colorHex} />;
}

export default BookOpenIcon;
  