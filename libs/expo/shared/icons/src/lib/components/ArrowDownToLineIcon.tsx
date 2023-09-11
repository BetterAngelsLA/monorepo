import ArrowDownToLineIconSVG from '../../assets/arrow-down-to-line.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ArrowDownToLineIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);

  const colorHex = extractColor(color);
  return <ArrowDownToLineIconSVG width={w} height={h} fill={colorHex} />;
};

export default ArrowDownToLineIcon;
