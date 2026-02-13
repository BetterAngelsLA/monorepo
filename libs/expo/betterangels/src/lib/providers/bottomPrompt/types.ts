import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';

export type BottomPromptRenderApi = {
  close: () => void;
};

export type BottomPromptOptions = {
  hideCloseButton?: boolean;
  onCloseStart?: () => void;
  onCloseEnd?: () => void;
  sheetHeight?: number;
  topNavStyle?: ViewStyle;
  contentStyle?: ViewStyle;
};

export type BottomPromptContextValue = {
  showBottomPrompt: (
    render: (api: BottomPromptRenderApi) => ReactNode,
    options?: BottomPromptOptions
  ) => void;
  closeBottomPrompt: () => void;
};
