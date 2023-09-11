import FaceUnamusedIconSVG from '../../assets/face-unamused.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceUnamusedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceUnamusedIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceUnamusedIcon;
