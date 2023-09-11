import FaceExplodeIconSVG from '../../assets/face-explode.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceExplodeIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceExplodeIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceExplodeIcon;
