import { ChevronUpIcon } from '@monorepo/react/icons';
import { mergeCss } from '@monorepo/react/shared';
import { PropsWithChildren, ReactElement, useId } from 'react';
import { usePrintExpansion } from '../../../hooks/usePrintExpansion';

interface IProps extends PropsWithChildren {
  className?: string;
  icon?: ReactElement;
  type?: 'alert';
  title?: string;
}

export function ResourceCallout(props: IProps) {
  const {
    icon,
    type = 'alert',
    className,
    children,
    title = 'Useful Tips',
  } = props;

  const { isOpen, handleToggle } = usePrintExpansion();
  const contentId = useId();

  const parentCss = [
    'items-start',
    'p-4',
    'md:px-6',
    type === 'alert' ? 'bg-neutral-99' : 'bg-white',
    className,
  ];

  return (
    <div className={mergeCss(parentCss)}>
      <div className="w-full flex items-center">
        {icon && <div className="mr-6">{icon}</div>}
        <div
          className="flex items-center justify-between w-full flex-1 cursor-pointer"
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <div className="font-bold h-8 flex items-center text-xl">{title}</div>
          <ChevronUpIcon
            className={`h-4 w-4 transition-transform ${
              isOpen ? 'rotate-0' : 'rotate-180'
            }`}
            aria-hidden="true"
          />
        </div>
      </div>
      <div
        id={contentId}
        className={`mt-4 ${isOpen ? 'block' : 'hidden'}`}
      >
        {children}
      </div>
    </div>
  );
}
