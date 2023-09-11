import FaceZipperIconSVG from '../../assets/face-zipper.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceZipperIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceZipperIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceZipperIcon;
