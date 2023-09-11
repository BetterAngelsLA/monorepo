import FaceSleepyIconSVG from '../../assets/face-sleepy.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceSleepyIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceSleepyIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceSleepyIcon;
