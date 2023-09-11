import ArrowDownIconSVG from '../../assets/arrow-down.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ArrowDownIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowDownIconSVG width={w} height={h} fill={colorHex} />;
};

export default ArrowDownIcon;
