import FileArrowDownIconSVG from '../../assets/file-arrow-down.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FileArrowDownIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FileArrowDownIconSVG width={w} height={h} fill={colorHex} />;
};

export default FileArrowDownIcon;
