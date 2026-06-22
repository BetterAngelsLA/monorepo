import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '../types';

type SortIconProps = {
  hasSortValue: boolean;
  isActive: boolean;
  direction: SortDirection | null;
};

export function SortIcon({ hasSortValue, isActive, direction }: SortIconProps) {
  if (!hasSortValue) return null;

  if (!isActive || !direction) {
    return <ArrowUpDown size={16} className="text-[#B0B5BD]" />;
  }

  if (direction === 'asc') {
    return <ArrowUp size={16} className="text-[#3D7FFF]" />;
  }

  return <ArrowDown size={16} className="text-[#3D7FFF]" />;
}
