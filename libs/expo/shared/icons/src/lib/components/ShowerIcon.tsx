import ShowerIconSVG from '../../assets/shower.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ShowerIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ShowerIconSVG width={w} height={h} fill={colorHex} />;
};

export default ShowerIcon;
