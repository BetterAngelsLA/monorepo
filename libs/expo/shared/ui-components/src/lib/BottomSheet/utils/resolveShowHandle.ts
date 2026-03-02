import { BottomSheetVariant } from '../types';

export function resolveShowHandle(params: {
  userValue?: boolean;
  variant: BottomSheetVariant;
  snapPoints?: unknown;
}): boolean {
  const { userValue, variant, snapPoints } = params;

  if (userValue !== undefined) {
    return userValue;
  }

  if (variant === 'bare') {
    return false;
  }

  const hasMultipleSnapPoints =
    Array.isArray(snapPoints) && snapPoints.length > 1;

  return hasMultipleSnapPoints;
}
