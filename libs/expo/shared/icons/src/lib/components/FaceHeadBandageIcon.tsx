import FaceHeadBandageIconSVG from '../../assets/face-head-bandage.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceHeadBandageIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceHeadBandageIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceHeadBandageIcon;
