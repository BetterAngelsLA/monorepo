import { ChevronDownIcon } from '@monorepo/react/icons';
import {
  Dispatch,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { mergeCss } from '../utils/styles/mergeCss';

interface IExpandableContainer extends PropsWithChildren {
  className?: string;
  header?: ReactNode | string;
  disabled?: boolean;
  open?: boolean;
  onClick?: (opened: boolean) => void;
}

export function ExpandableContainer(
  props: IExpandableContainer
): ReactElement | null {
  const {
    header,
    disabled,
    className,
    open = false,
    children,
    onClick,
  }: IExpandableContainer = props;

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

  const parentCss: string = [className].join(' ');

  const headerCss: string = [
    'flex',
    'justify-between',
    'items-center',
    disabled ? '' : 'cursor-pointer',
  ].join(' ');

  const iconCss = ['h-5', isOpen ? 'rotate-180' : 'rotate-none'];

  const contentCss = ['mt-6'];

  return (
    <div className={parentCss}>
      <div className={headerCss} onClick={onExpanCollapse}>
        {!!header && header}
        <ChevronDownIcon className={mergeCss(iconCss)} strokeWidth={2} />
      </div>
      {isOpen && !disabled && (
        <div className={mergeCss(contentCss)}>{children}</div>
      )}
    </div>
  );
}
