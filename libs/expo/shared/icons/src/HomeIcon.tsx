import { faHouse } from '@fortawesome/pro-regular-svg-icons/faHouse';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import * as React from 'react';
import { IIconProps } from './types';

export default function HomeIcon(props: IIconProps) {
  const { color, style, size = 25 } = props;
  return (
    <FontAwesomeIcon icon={faHouse} size={size} style={{ color, ...style }} />
  );
}
