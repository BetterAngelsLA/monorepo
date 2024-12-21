import { Button } from '@monorepo/react/components';
import { useResetAtom } from 'jotai/utils';
import { shelterFiltersAtom } from '../../atoms/shelterFiltersAtom';
import { mergeCss } from '../../utils/styles/mergeCss';

type IProps = {
  className?: string;
  onDone?: () => void;
  onReset?: () => void;
};

export function FiltersActions(props: IProps) {
  const { onDone, onReset, className } = props;

  const resetFilters = useResetAtom(shelterFiltersAtom);

  const parentCss = [
    'flex',
    'items-center',
    'justify-center',
    'p-4',
    'bg-white',
    className,
  ];

  function handleReset() {
    resetFilters();

    if (onReset) {
      onReset();
    }
  }

  function handleDone() {
    if (onDone) {
      onDone();
    }
  }

  return (
    <div className={mergeCss(parentCss)}>
      <Button
        onClick={handleReset}
        variant="secondary"
        size="lg"
        className="w-[132px] text-primary-60 bg-white border border-neutral-98 text-base"
      >
        Reset All
      </Button>
      <Button
        onClick={handleDone}
        variant="secondary"
        size="lg"
        className="ml-2.5 w-[132px] bg-primary-60 text-white text-base"
      >
        Done
      </Button>
    </div>
  );
}
