import HouseIconSVG from '../../assets/house.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const HouseIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <HouseIconSVG width={w} height={h} fill={colorHex} />;
};

export default HouseIcon;
