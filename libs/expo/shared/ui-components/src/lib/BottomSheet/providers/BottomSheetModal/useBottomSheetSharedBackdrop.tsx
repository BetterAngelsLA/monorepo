/**
 * useBottomSheetSharedBackdrop
 *
 * Internal hook that renders a single shared backdrop for all sheets.
 *
 * Used when `enableSharedBackdrop` is enabled to avoid multiple
 * Gorhom backdrops competing in the view hierarchy (e.g. when using
 * FullWindowOverlay).
 *
 * Behavior:
 * - Backdrop is visible if any non-closing sheet exists
 * - Pressing backdrop triggers `popTopSheet`
 * - Rendered inside optional `containerComponent`
 *
 * This replaces per-sheet backdrops with a centralized overlay.
 */

import { ComponentType, ReactNode, useCallback } from 'react';
import { BackdropOverlay } from '../../core/BackdropOverlay';
import { TBottomSheetInstance } from './types.internal';

type UseBottomSheetSharedBackdropResult = {
  render: () => ReactNode;
};

type UseBottomSheetSharedBackdropParams = {
  enabled: boolean;
  Container?: ComponentType<{ children?: ReactNode }>;
  sheets: TBottomSheetInstance[];
  closingSheetIds: Set<string>;
  popTopSheet: () => void;
};

export function useBottomSheetSharedBackdrop(
  params: UseBottomSheetSharedBackdropParams
): UseBottomSheetSharedBackdropResult {
  const { enabled, Container, sheets, closingSheetIds, popTopSheet } = params;

  const backdropVisible = sheets.some(
    (sheet) => !closingSheetIds.has(sheet.id)
  );

  const render = useCallback(() => {
    if (!enabled || !Container || !backdropVisible) {
      return null;
    }

    return (
      <Container>
        <BackdropOverlay visible={true} onPress={popTopSheet} />
      </Container>
    );
  }, [enabled, Container, backdropVisible, popTopSheet]);

  return {
    render,
  };
}
