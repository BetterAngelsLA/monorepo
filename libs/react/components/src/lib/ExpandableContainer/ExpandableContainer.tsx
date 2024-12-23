import { ChevronLeftIcon } from '@monorepo/react/icons';
import {
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { mergeCss } from '../../utils/mergeCss';

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

  const iconCss = [
    'w-3',
    isOpen ? 'rotate-90' : '-rotate-90',
    'text-primary-20',
  ];

  const contentCss = ['mt-6'];

  return (
    <div className={mergeCss(parentCss)}>
      <div className={mergeCss(headerCss)} onClick={onExpanCollapse}>
        {!!header && header}
        <ChevronLeftIcon className={mergeCss(iconCss)} />
      </div>
      {isOpen && !disabled && (
        <div className={mergeCss(contentCss)}>{children}</div>
      )}
    </div>
  );
}
