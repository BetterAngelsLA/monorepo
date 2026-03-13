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
