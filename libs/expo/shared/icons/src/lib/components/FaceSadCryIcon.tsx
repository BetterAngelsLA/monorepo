import FaceSadCryIconSVG from '../../assets/face-sad-cry.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceSadCryIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSadCryIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceSadCryIcon;
