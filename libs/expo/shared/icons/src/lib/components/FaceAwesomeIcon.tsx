import FaceAwesomeIconSVG from '../../assets/face-awesome.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceAwesomeIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceAwesomeIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceAwesomeIcon;
