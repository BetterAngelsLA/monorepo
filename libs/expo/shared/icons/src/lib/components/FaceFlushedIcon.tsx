import FaceFlushedIconSVG from '../../assets/face-flushed.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceFlushedIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceFlushedIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceFlushedIcon;
