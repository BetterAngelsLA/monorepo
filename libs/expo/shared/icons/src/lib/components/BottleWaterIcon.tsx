import BottleWaterIconSVG from '../../assets/bottle-water.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const BottleWaterIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BottleWaterIconSVG width={w} height={h} fill={colorHex} />;
};

export default BottleWaterIcon;
