import ShirtIconSVG from '../../assets/shirt.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ShirtIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ShirtIconSVG width={w} height={h} fill={colorHex} />;
};

export default ShirtIcon;
