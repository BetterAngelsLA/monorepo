import FaceScreamIconSVG from '../../assets/face-scream.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceScreamIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceScreamIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceScreamIcon;
