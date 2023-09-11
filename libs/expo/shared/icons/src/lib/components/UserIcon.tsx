import UserIconSVG from '../../assets/user.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const UserIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <UserIconSVG width={w} height={h} fill={colorHex} />;
};

export default UserIcon;
