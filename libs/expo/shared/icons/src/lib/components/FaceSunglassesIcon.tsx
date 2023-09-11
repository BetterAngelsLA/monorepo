import FaceSunglassesIconSVG from '../../assets/face-sunglasses.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceSunglassesIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSunglassesIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceSunglassesIcon;
