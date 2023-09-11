import ArrowTrendUpIconSVG from '../../assets/arrow-trend-up.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ArrowTrendUpIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowTrendUpIconSVG width={w} height={h} fill={colorHex} />;
};

export default ArrowTrendUpIcon;
