import FaceNauseatedIconSVG from '../../assets/face-nauseated.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceNauseatedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceNauseatedIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceNauseatedIcon;
