import { ChevronUpIcon } from '@monorepo/react/icons';
import { PropsWithChildren, ReactElement } from 'react';
import { mergeCss } from '../../../utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  icon?: ReactElement;
  type?: 'alert';
}

export function ResourceCallout(props: IProps) {
  const { icon, type = 'alert', className, children } = props;

  const parentCss = [
    'items-start',
    'p-4',
    'md:px-6',
    type === 'alert' ? 'bg-neutral-99' : 'white',
    className,
  ];

  const iconCss = ['mr-6'];

  return (
    <div className={mergeCss(parentCss)}>
      <details className="cursor-pointer">
        <summary className="flex items-center w-full">
          {!!icon && <div className={mergeCss(iconCss)}>{icon}</div>}
          <div className="flex items-center justify-between w-full flex-1">
            <div className="font-bold h-8 flex items-center text-xl">
              Useful Tips
            </div>
            <ChevronUpIcon className="h-4 w-4 transition-transform transform chevron rotate-180" />
          </div>
        </summary>

        <div className="mt-4">{children}</div>
      </details>
    </div>
  );
}
