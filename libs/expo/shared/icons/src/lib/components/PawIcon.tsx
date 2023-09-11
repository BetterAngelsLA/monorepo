import PawIconSVG from '../../assets/paw.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const PawIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <PawIconSVG width={w} height={h} fill={colorHex} />;
};

export default PawIcon;
