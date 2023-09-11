import GearIconSVG from '../../assets/gear.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const GearIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <GearIconSVG width={w} height={h} fill={colorHex} />;
};

export default GearIcon;
