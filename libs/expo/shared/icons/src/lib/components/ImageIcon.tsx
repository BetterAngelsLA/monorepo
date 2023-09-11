import ImageIconSVG from '../../assets/image.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const ImageIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <ImageIconSVG width={w} height={h} fill={colorHex} />;
};

export default ImageIcon;
