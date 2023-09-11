import XmarkIconSVG from '../../assets/xmark.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const XmarkIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <XmarkIconSVG width={w} height={h} fill={colorHex} />;
};

export default XmarkIcon;
