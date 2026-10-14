import { ChevronLeftIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';

interface ChevronIconProps {
  up: boolean;
  color?: string;
}

export function ChevronIcon({ up, color }: ChevronIconProps) {
  return (
    <ChevronLeftIcon
      size="sm"
      color={color || Colors.WHITE}
      rotate={up ? '90deg' : '270deg'}
    />
  );
}
