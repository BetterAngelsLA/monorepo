import FaceSmileHeartsIconSVG from '../../assets/face-smile-hearts.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceSmileHeartsIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSmileHeartsIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceSmileHeartsIcon;
