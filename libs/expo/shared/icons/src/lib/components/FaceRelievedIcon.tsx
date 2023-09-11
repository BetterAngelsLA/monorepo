import FaceRelievedIconSVG from '../../assets/face-relieved.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceRelievedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceRelievedIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceRelievedIcon;
