import FaceCloudsIconSVG from '../../assets/face-clouds.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceCloudsIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceCloudsIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceCloudsIcon;
