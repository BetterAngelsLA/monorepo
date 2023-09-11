import HeadSideBrainIconSVG from '../../assets/head-side-brain.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const HeadSideBrainIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <HeadSideBrainIconSVG width={w} height={h} fill={colorHex} />;
};

export default HeadSideBrainIcon;
