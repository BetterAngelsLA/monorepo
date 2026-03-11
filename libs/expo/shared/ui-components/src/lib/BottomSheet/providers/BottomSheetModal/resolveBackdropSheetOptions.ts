import { BottomSheetOptions } from '../../types';

export function resolveBackdropSheetOptions(
  singleBackdrop: boolean,
  options?: BottomSheetOptions
): BottomSheetOptions {
  if (!singleBackdrop) {
    return options ?? {};
  }

  if (options?.disableBackdrop !== undefined) {
    return options;
  }

  return {
    ...options,
    disableBackdrop: true,
  };
}
