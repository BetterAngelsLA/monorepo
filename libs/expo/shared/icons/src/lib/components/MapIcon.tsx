import MapIconSVG from '../../assets/map.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const MapIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <MapIconSVG width={w} height={h} fill={colorHex} />;
};

export default MapIcon;
