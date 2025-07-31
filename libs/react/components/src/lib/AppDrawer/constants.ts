import { appZIndex } from '@monorepo/react/shared';
import { TDrawerPlacement } from './state/appDrawerAtom';

export const ANIMATION_TIMING = 300;

export const zIndex = appZIndex.p2;

type TTransitionByPlacement = {
  IN: string;
  OUT: string;
};

export const DRAWER_TRANSITION: Record<
  TDrawerPlacement,
  TTransitionByPlacement
> = {
  left: {
    IN: `animate-[slideInFromLeft_300ms_forwards]`,
    OUT: `animate-[slideOutToLeft_300ms_forwards]`,
  },
  right: {
    IN: `animate-[slideInFromRight_300ms_forwards]`,
    OUT: `animate-[slideOutToRight_300ms_forwards]`,
  },
};

export const ANIMATION_FADE = {
  IN: `animate-[fadeIn_300ms_forwards]`,
  OUT: `animate-[fadeOut_300ms_forwards]`,
};
