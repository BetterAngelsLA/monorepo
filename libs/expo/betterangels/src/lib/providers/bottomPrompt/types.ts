import { ReactNode } from 'react';

export type BottomPromptRenderApi = {
  close: () => void;
};

export type BottomPromptOptions = {
  hideCloseButton?: boolean;
};

export type BottomPromptContextValue = {
  showBottomPrompt: (
    render: (api: BottomPromptRenderApi) => ReactNode,
    options?: BottomPromptOptions
  ) => void;
  closeBottomPrompt: () => void;
};
