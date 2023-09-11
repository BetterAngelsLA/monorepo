import WarehouseIconSVG from '../../assets/warehouse.svg';
import { IIconProps } from '../types';
import { extractColor, extractSize } from '../utils';

const WarehouseIcon = ({ size = 'md', color = 'black' }: IIconProps) => {
  const { w, h } = extractSize(size);
  const colorHex = extractColor(color);
  return <WarehouseIconSVG width={w} height={h} fill={colorHex} />;
};

export default WarehouseIcon;
