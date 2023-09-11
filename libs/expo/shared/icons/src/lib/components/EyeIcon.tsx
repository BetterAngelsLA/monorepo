import EyeIconSVG from '../../assets/eye.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const EyeIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <EyeIconSVG width={w} height={h} fill={colorHex} />;
};

export default EyeIcon;
