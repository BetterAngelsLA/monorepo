import BlanketIconSVG from '../../assets/blanket.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const BlanketIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BlanketIconSVG width={w} height={h} fill={colorHex} />;
};

export default BlanketIcon;
