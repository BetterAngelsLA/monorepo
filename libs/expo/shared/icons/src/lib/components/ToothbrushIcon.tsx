import ToothbrushIconSVG from '../../assets/toothbrush.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ToothbrushIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ToothbrushIconSVG width={w} height={h} fill={colorHex} />;
};

export default ToothbrushIcon;
