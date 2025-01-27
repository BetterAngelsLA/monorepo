import { ChevronLeftIcon } from '@monorepo/react/icons';
import { PropsWithChildren, ReactElement, useState } from 'react';
import { mergeCss } from '../../../utils/styles/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  icon?: ReactElement;
  type?: 'alert';
}

export function ResourceCallout(props: IProps) {
  const { icon, type = 'alert', className, children } = props;
  const [show, setShow] = useState(true);

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
      <div className="w-full flex items-center">
        {!!icon && <div className={mergeCss(iconCss)}>{icon}</div>}
        <div className="flex items-center justify-between w-full flex-1">
          <div className="font-bold h-8 flex items-center text-xl">
            Useful Tips
          </div>
          <div onClick={() => setShow(!show)}>
            <ChevronLeftIcon
              className={`h-4 w-4 ${show ? 'rotate-90' : '-rotate-90'}`}
            />
          </div>
        </div>
      </div>
      {show && <div className="mt-4">{children}</div>}
    </div>
  );
}
