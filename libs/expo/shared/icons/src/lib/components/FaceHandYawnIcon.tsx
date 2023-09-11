import FaceHandYawnIconSVG from '../../assets/face-hand-yawn.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceHandYawnIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceHandYawnIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceHandYawnIcon;
