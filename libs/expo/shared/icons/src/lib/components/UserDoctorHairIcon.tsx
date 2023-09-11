import UserDoctorHairIconSVG from '../../assets/user-doctor-hair.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const UserDoctorHairIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <UserDoctorHairIconSVG width={w} height={h} fill={colorHex} />;
};

export default UserDoctorHairIcon;
