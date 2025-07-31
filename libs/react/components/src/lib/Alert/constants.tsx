import { CheckIcon } from '@monorepo/react/icons';
import { appZIndex } from '@monorepo/react/shared';
import { TAlertConfig, TAlertType } from './types';

// Needs to be greater than the HIDE Animation duration
export const CLOSE_ANIMATION_TIMING = 250;

export const ANIMATION = {
  SHOW: 'animate-slide-in-from-top',
  HIDE: 'animate-[fadeOutScaleOut_200ms_ease-in-out_forwards]',
};

export const zIndex = appZIndex.p1;

export const alertConfig: Record<TAlertType, TAlertConfig> = {
  success: {
    color: 'var(--color-success-30)',
    Icon: (
      <CheckIcon className="h-6 text-success-30 bg-white rounded-full p-1 flex-shrink-0 " />
    ),
  },
  error: {
    color: 'var(--color-alert-60)',
  },
} as const;
