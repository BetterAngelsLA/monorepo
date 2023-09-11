import PlusIconSVG from '../../assets/plus.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const PlusIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <PlusIconSVG width={w} height={h} fill={colorHex} />;
};

export default PlusIcon;
