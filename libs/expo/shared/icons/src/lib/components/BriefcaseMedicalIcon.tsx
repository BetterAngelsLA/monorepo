
import React from 'react';
import BriefcaseMedicalIconSVG from '../svg/briefcase-medical.svg';
import { IIconProps } from '../types';
import { extractSize, extractColor } from '../utils';

const BriefcaseMedicalIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BriefcaseMedicalIconSVG width={w} height={h} fill={colorHex} />;
}

export default BriefcaseMedicalIcon;
  