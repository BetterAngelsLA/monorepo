import StethoscopeIconSVG from '../../assets/stethoscope.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const StethoscopeIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <StethoscopeIconSVG width={w} height={h} fill={colorHex} />;
};

export default StethoscopeIcon;
