import { ExpandablePillRow } from './ExpandablePillRow';
import { SinglePillRow } from './SinglePillRow';

export function PillContainer({
  maxVisible = 5,
  pills,
  pillVariant,
  variant = 'singleRow',
}: {
  maxVisible?: number;
  pills: string[];
  pillVariant: 'primary' | 'success' | 'warning';
  variant: 'singleRow' | 'expandable';
}) {
  if (variant === 'expandable') {
    return (
      <ExpandablePillRow
        pills={pills}
        pillVariant={pillVariant}
        maxVisible={maxVisible}
      />
    );
  } else {
    return <SinglePillRow pills={pills} pillVariant={pillVariant} />;
  }
}

PillContainer.defaultProps = {
  variant: 'singleRow',
};
