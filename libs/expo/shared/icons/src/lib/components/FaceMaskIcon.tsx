import FaceMaskIconSVG from '../../assets/face-mask.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceMaskIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceMaskIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceMaskIcon;
