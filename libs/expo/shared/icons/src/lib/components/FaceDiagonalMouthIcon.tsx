import FaceDiagonalMouthIconSVG from '../../assets/face-diagonal-mouth.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceDiagonalMouthIcon = ({
  size = 'md',
  color = 'black',
}: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceDiagonalMouthIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceDiagonalMouthIcon;
