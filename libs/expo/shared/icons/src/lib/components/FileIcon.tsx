import FileIconSVG from '../../assets/file.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FileIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FileIconSVG width={w} height={h} fill={colorHex} />;
};

export default FileIcon;
