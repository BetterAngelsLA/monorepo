import MagnifyingGlassIconSVG from '../../assets/magnifying-glass.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const MagnifyingGlassIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <MagnifyingGlassIconSVG width={w} height={h} fill={colorHex} />;
};

export default MagnifyingGlassIcon;
