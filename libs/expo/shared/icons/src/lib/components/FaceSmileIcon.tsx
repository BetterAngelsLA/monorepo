import FaceSmileIconSVG from '../../assets/face-smile.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceSmileIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSmileIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceSmileIcon;
