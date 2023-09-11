import FaceSadTearIconSVG from '../../assets/face-sad-tear.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceSadTearIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSadTearIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceSadTearIcon;
