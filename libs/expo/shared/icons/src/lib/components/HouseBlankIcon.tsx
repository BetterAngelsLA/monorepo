import HouseBlankIconSVG from '../../assets/house-blank.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const HouseBlankIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <HouseBlankIconSVG width={w} height={h} fill={colorHex} />;
};

export default HouseBlankIcon;
