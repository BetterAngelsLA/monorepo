import { useVisibilityObserver } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { mergeCss } from '../../utils';
import { LoadingView } from '../LoadingView';

type TProps = {
  onLoadMore: () => void;
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  children?: ReactNode;
};

export function InfiniteScrollTrigger(props: TProps) {
  const {
    onLoadMore,
    enabled = true,
    root,
    rootMargin,
    threshold,
    className,
    children,
  } = props;

  const { triggerRef } = useVisibilityObserver({
    onTrigger: onLoadMore,
    enabled,
    root,
    rootMargin,
    threshold,
  });

  const parentCss = ['min-h-px', 'mt-4', className];

  if (!enabled) {
    return null;
  }

  return (
    <div ref={triggerRef} className={mergeCss(parentCss)}>
      {children}

      {!children && <LoadingView />}
    </div>
  );
}
