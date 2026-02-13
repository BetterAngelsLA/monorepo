// bottomPromptAnimations.ts

import { Animated, Easing } from 'react-native';

export type TAnimationName = 'enter' | 'exit';

export type TAnimationContext = {
  translateY: Animated.Value;
  backdropOpacity: Animated.Value;
  sheetHeight: number;
};

type AnimationFactory = (ctx: TAnimationContext) => Animated.CompositeAnimation;

const animations: Record<TAnimationName, AnimationFactory> = {
  enter: (ctx) =>
    Animated.parallel([
      Animated.timing(ctx.translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ctx.backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]),

  exit: (ctx) =>
    Animated.parallel([
      Animated.timing(ctx.translateY, {
        toValue: ctx.sheetHeight,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ctx.backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]),
};

export function runBottomPromptAnimation(
  name: TAnimationName,
  ctx: TAnimationContext,
  onEnd?: () => void
) {
  const animationFactory = animations[name];

  const animation = animationFactory(ctx);

  animation.start(({ finished }) => {
    if (finished) {
      onEnd?.();
    }
  });

  return animation;
}
