import ArrowUpIconSVG from '../../assets/arrow-up.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ArrowUpIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowUpIconSVG width={w} height={h} fill={colorHex} />;
};

export default ArrowUpIcon;
