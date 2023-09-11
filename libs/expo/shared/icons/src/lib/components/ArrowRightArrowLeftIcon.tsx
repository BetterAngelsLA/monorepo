import ArrowRightArrowLeftIconSVG from '../../assets/arrow-right-arrow-left.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ArrowRightArrowLeftIcon = ({
  size = 'md',
  color = 'black',
}: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ArrowRightArrowLeftIconSVG width={w} height={h} fill={colorHex} />;
};

export default ArrowRightArrowLeftIcon;
