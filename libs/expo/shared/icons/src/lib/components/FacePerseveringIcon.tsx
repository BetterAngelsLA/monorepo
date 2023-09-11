import FacePerseveringIconSVG from '../../assets/face-persevering.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FacePerseveringIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FacePerseveringIconSVG width={w} height={h} fill={colorHex} />;
};

export default FacePerseveringIcon;
