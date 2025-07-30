import { TDrawerPlacement } from './state/appDrawerAtom';

export const ANIMATION_TIMING = 300;

type TTransitionByPlacement = {
  IN: 'animate-slide-in-from-left' | 'animate-slide-in-from-right';
  OUT: 'animate-slide-out-to-left' | 'animate-slide-out-to-right';
};

export const DRAWER_TRANSITION: Record<
  TDrawerPlacement,
  TTransitionByPlacement
> = {
  left: {
    IN: 'animate-slide-in-from-left',
    OUT: 'animate-slide-out-to-left',
  },
  right: {
    IN: 'animate-slide-in-from-right',
    OUT: 'animate-slide-out-to-right',
  },
};
