import FaceMehIconSVG from '../../assets/face-meh.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceMehIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceMehIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceMehIcon;
