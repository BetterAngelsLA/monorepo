import MicrophoneIconSVG from '../../assets/microphone.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const MicrophoneIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <MicrophoneIconSVG width={w} height={h} fill={colorHex} />;
};

export default MicrophoneIcon;
