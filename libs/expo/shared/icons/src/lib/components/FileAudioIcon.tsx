import FileAudioIconSVG from '../../assets/file-audio.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FileAudioIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FileAudioIconSVG width={w} height={h} fill={colorHex} />;
};

export default FileAudioIcon;
