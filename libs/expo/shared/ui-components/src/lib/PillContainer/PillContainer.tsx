import { ExpandablePillRow } from './ExpandablePillRow';
import { SinglePillRow } from './SinglePillRow';

export function PillContainer({
  maxVisible = 5,
  pills,
  pillVariant,
  variant,
}: {
  maxVisible?: number;
  pills: string[];
  pillVariant: 'primary' | 'success' | 'warning';
  variant: 'singleRow' | 'expandable';
}) {
  if (variant === 'singleRow') {
    return (
      <SinglePillRow pills={pills} pillVariant={pillVariant} pillGap={6} />
    );
  }
  return (
    <ExpandablePillRow
      pills={pills}
      pillVariant={pillVariant}
      maxVisible={maxVisible}
    />
  );
}
