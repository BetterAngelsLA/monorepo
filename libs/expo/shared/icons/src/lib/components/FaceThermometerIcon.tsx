import FaceThermometerIconSVG from '../../assets/face-thermometer.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const FaceThermometerIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <FaceThermometerIconSVG width={w} height={h} fill={colorHex} />;
};

export default FaceThermometerIcon;
