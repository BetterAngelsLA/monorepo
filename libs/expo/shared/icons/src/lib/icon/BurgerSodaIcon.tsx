
import React from 'react';
import BurgerSodaIconSVG from '../svg/burger-soda.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const BurgerSodaIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BurgerSodaIconSVG width={w} height={h} fill={colorHex} />;
}

export default BurgerSodaIcon;
  