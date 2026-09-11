import { ChevronLeftIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';

type IProps = {
  expanded: boolean;
  moreLabel: string;
  lessLabel: string;
  controls: string;
  onClick: () => void;
};

export function ShowMoreToggle(props: IProps) {
  const {
    expanded,
    moreLabel,
    lessLabel,
    controls,
    onClick,
  } = props;

  return (
    <button
      type="button"
      className="mt-8 flex w-full items-center justify-end gap-2 text-primary-20"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
    >
      <span>{expanded ? lessLabel : moreLabel}</span>

      <ChevronLeftIcon
        className={mergeCss([
          'w-3',
          expanded ? 'rotate-90' : '-rotate-90',
          'text-primary-20',
          'transition-transform',
        ])}
      />
    </button>
  );
}
