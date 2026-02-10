import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { flyoutAtom } from '../atoms/flyoutAtom';
import { FlyoutMask } from './Flyoutmask';

export enum FlyoutAnimationEnum {
  FLYOUT_LEFT = 'animate-slideRightToLeft',
}

export interface IFlyout extends PropsWithChildren {
  className?: string;
  header?: string | ReactNode;
  animation?: FlyoutAnimationEnum | null;
  closeOnClick?: boolean;
}

export function Flyout(props: IFlyout): ReactElement | null {
  const {
    className = '',
    animation = FlyoutAnimationEnum.FLYOUT_LEFT,
    closeOnClick,
    children,
  } = props;

  const [_flyout, setFlyout] = useAtom(flyoutAtom);

  function handleMaskClick(): void {
    if (closeOnClick) setFlyout(null);
  }

  const flyoutCss = [
    'fixed',
    'top-0',
    'right-0',
    'h-full',
    'w-[96vw]',
    'bg-[#1E3342]',
    'shadow-lg',
    'z-[1000]',
    'rounded-l-2xl',
    animation,
    className,
  ];

  return (
    <FlyoutMask onClickOutside={handleMaskClick}>
      <div className={mergeCss(flyoutCss)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </FlyoutMask>
  );
}
