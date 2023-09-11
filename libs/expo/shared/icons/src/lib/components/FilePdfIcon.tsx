import FilePdfIconSVG from '../../assets/file-pdf.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FilePdfIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FilePdfIconSVG width={w} height={h} fill={colorHex} />;
};

export default FilePdfIcon;
