import ArrowLeftIconSVG from '../../assets/arrow-left.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ArrowLeftIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowLeftIconSVG width={w} height={h} fill={colorHex} />;
};

export default ArrowLeftIcon;
