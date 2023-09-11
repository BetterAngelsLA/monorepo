import BuildingUserIconSVG from '../../assets/building-user.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const BuildingUserIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <BuildingUserIconSVG width={w} height={h} fill={colorHex} />;
};

export default BuildingUserIcon;
