import CalendarIconSVG from '../../assets/calendar.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const CalendarIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <CalendarIconSVG width={w} height={h} fill={colorHex} />;
};

export default CalendarIcon;
