import ShoePrintsIconSVG from '../../assets/shoe-prints.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ShoePrintsIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ShoePrintsIconSVG width={w} height={h} fill={colorHex} />;
};

export default ShoePrintsIcon;
