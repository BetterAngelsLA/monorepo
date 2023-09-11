import BookOpenIconSVG from '../../assets/book-open.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const BookOpenIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BookOpenIconSVG width={w} height={h} fill={colorHex} />;
};

export default BookOpenIcon;
