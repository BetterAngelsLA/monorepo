import { BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { ReactNode } from 'react';

/**
 * Public configuration options supported by the app-level
 * BottomSheet abstraction.
 */
export type BottomSheetOptions = {
  snapPoints?: Array<string | number>;
  enableDynamicSizing?: boolean;
  enablePanDownToClose?: boolean;
  backgroundStyle?: BottomSheetModalProps['backgroundStyle'];

  // Provider-level behavior
  stackBehavior?: BottomSheetModalProps['stackBehavior'];
  maxHeight?: number;

  // Backdrop customization
  disableBackdrop?: boolean;
  backdropOpacity?: number;

  // Content behavior
  scrollable?: boolean;
};

export type BottomSheetRenderApi = {
  closeSheet: () => void;
};

export type BottomSheetContextValue = {
  showBottomSheet: (
    render: (api: BottomSheetRenderApi) => ReactNode,
    options?: BottomSheetOptions
  ) => void;
  popTopSheet: () => void;
};

export type ShowBottomSheetParams = {
  content: (api: BottomSheetRenderApi) => ReactNode;
  options?: BottomSheetOptions;
};
