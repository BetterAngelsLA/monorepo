import { ChevronDownIcon } from '@monorepo/react/icons';
import {
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { mergeCss } from '../../lib-utils/mergeCss';

interface IProps extends PropsWithChildren {
  className?: string;
  header?: ReactNode | string;
  disabled?: boolean;
  open?: boolean;
  onClick?: (opened: boolean) => void;
}

export function ExpandableContainer(props: IProps) {
  const {
    header,
    disabled,
    className,
    open = false,
    children,
    onClick,
  } = props;

  const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
    useState<boolean>(open);

  useEffect((): void => {
    setIsOpen(open);
  }, [setIsOpen, open]);

  function onExpanCollapse(): void {
    if (disabled) {
      return;
    }

    const newOpenState = !isOpen;

    setIsOpen(newOpenState);

    if (onClick) {
      onClick(newOpenState);
    }
  }

  const parentCss = [className];

  const headerCss = [
    'flex',
    'justify-between',
    'items-center',
    disabled ? '' : 'cursor-pointer',
  ];

  const iconCss = ['h-5', isOpen ? 'rotate-180' : 'rotate-none'];

  const contentCss = ['mt-6'];

  return (
    <div className={mergeCss(parentCss)}>
      <div className={mergeCss(headerCss)} onClick={onExpanCollapse}>
        {!!header && header}
        <ChevronDownIcon className={mergeCss(iconCss)} strokeWidth={2} />
      </div>
      {isOpen && !disabled && (
        <div className={mergeCss(contentCss)}>{children}</div>
      )}
    </div>
  );
}
