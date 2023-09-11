import NoteIconSVG from '../../assets/note.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const NoteIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <NoteIconSVG width={w} height={h} fill={colorHex} />;
};

export default NoteIcon;
