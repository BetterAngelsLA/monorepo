import FaceAnxiousSweatIconSVG from '../../assets/face-anxious-sweat.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceAnxiousSweatIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceAnxiousSweatIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceAnxiousSweatIcon;
