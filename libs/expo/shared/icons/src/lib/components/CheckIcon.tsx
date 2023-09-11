import CheckIconSVG from '../../assets/check.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const CheckIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <CheckIconSVG width={w} height={h} fill={colorHex} />;
};

export default CheckIcon;
