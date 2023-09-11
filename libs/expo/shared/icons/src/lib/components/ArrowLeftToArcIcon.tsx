import ArrowLeftToArcIconSVG from '../../assets/arrow-left-to-arc.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ArrowLeftToArcIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowLeftToArcIconSVG width={w} height={h} fill={colorHex} />;
};

export default ArrowLeftToArcIcon;
