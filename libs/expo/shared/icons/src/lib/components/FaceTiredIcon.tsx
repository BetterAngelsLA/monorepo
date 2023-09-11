import FaceTiredIconSVG from '../../assets/face-tired.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceTiredIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceTiredIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceTiredIcon;
