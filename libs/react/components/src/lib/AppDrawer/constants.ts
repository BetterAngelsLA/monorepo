import { appZIndex } from '@monorepo/react/shared';
import { TDrawerPlacement } from './types';

export const CLOSE_ANIMATION_TIMING = 300;

export const zIndex = appZIndex.p2;

type TTransitionByPlacement = {
  SHOW: string;
  HIDE: string;
};

export const DRAWER_ANIMATION: Record<
  TDrawerPlacement,
  TTransitionByPlacement
> = {
  left: {
    SHOW: 'animate-slide-in-from-left',
    HIDE: `animate-[slideOutToLeft_300ms_forwards]`,
  },
  right: {
    SHOW: 'animate-slide-in-from-right',
    HIDE: `animate-[slideOutToRight_300ms_forwards]`,
  },
};

export const ANIMATION_FADE = {
  SHOW: `animate-[fadeIn_300ms_forwards]`,
  HIDE: `animate-[fadeOut_300ms_forwards]`,
};
