import { BottomSheetVariant } from '../types';

export function resolveShowHandle(params: {
  userValue?: boolean;
  variant: BottomSheetVariant;
  snapPoints?: unknown;
}): boolean {
  const { userValue, variant, snapPoints } = params;

  // userValue always wins
  if (userValue !== undefined) {
    return userValue;
  }

  // `bare` means we provide the bare minimum
  if (variant === 'bare') {
    return false;
  }

  const hasMultipleSnapPoints =
    Array.isArray(snapPoints) && snapPoints.length > 1;

  // show `handle` only with multiple `snapPoints`, else it's useless
  return hasMultipleSnapPoints;
}
