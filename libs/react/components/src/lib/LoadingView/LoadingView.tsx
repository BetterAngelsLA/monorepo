import { mergeCss } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { LoadingSpinner, TLoadingSpinnerSize } from '../LoadingSpinner';

type TLoadingIndicatorOpts = {
  size?: TLoadingSpinnerSize;
  className?: string;
};

export type TLoadingView = {
  className?: string;
  content?: ReactNode;
  indicator?: TLoadingIndicatorOpts;
};

export function LoadingView(props: TLoadingView) {
  const { className, content, indicator } = props;

  const { size = 'medium', className: indicatorClassName } = indicator || {};

  const parentCss = ['flex', 'items-center', 'justify-center', className];

  return (
    <div className={mergeCss(parentCss)}>
      {content}

      {!content && (
        <LoadingSpinner size={size} className={indicatorClassName} />
      )}
    </div>
  );
}
