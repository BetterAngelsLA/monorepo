import { mergeCss } from '@monorepo/react/shared';
import { useAtom } from 'jotai';
import { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { FlyoutMask } from './FlyoutMask';
import { FlyoutAnimationEnum } from './enums';
import { flyoutAtom } from './flyoutAtom';

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
