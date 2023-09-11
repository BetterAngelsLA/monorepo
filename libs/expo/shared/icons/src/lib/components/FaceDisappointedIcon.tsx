import FaceDisappointedIconSVG from '../../assets/face-disappointed.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceDisappointedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceDisappointedIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceDisappointedIcon;
