import { BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { ReactNode } from 'react';

export type BottomSheetContextValue = {
  showBottomSheet: (
    render: (api: BottomSheetRenderApi) => ReactNode,
    options?: BottomSheetOptions
  ) => void;
  popTopSheet: () => void; // stack-level dismissal
};

export type BottomSheetRenderApi = {
  closeSheet: () => void;
};

export type BottomSheetOptions = {
  snapPoints?: Array<string | number>;
  enableDynamicSizing?: boolean;
  maxHeight?: number;
  enablePanDownToClose?: boolean;
  stackBehavior?: BottomSheetModalProps['stackBehavior'];
  backgroundStyle?: BottomSheetModalProps['backgroundStyle'];
  disableBackdrop?: boolean;
  backdropOpacity?: number;
};

export type ShowBottomSheetParams = {
  content: (api: BottomSheetRenderApi) => ReactNode;
  options?: BottomSheetOptions;
};
