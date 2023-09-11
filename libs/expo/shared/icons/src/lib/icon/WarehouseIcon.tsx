
import React from 'react';
import WarehouseIconSVG from '../svg/warehouse.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const WarehouseIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <WarehouseIconSVG width={w} height={h} fill={colorHex} />;
}

export default WarehouseIcon;
  