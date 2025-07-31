import { appZIndex } from '@monorepo/react/shared';
import { TAlertConfig, TAlertType } from './types';

// Needs to be greater than the Animation duration
export const CLOSE_ANIMATION_TIMING = 300;

export const zIndex = appZIndex.p1;

export const ANIMATION = {
  SHOW: 'animate-slide-in-from-top',
  HIDE: 'animate-fade-collapse',
};

export const alertConfig: Record<TAlertType, TAlertConfig> = {
  success: {
    color: 'var(--color-success-30)',
    // icon?: ReactNode,
  },
  error: {
    color: 'var(--color-alert-60)',
    // icon?: ReactNode;
  },
} as const;
