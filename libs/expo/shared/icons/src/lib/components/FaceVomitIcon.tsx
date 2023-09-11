import FaceVomitIconSVG from '../../assets/face-vomit.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceVomitIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceVomitIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceVomitIcon;
