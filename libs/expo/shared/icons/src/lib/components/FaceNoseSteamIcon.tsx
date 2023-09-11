import FaceNoseSteamIconSVG from '../../assets/face-nose-steam.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceNoseSteamIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceNoseSteamIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceNoseSteamIcon;
