import { ReactNode, useCallback, useState } from 'react';
import { BottomPrompt } from './BottomPrompt';
import { BottomPromptContext } from './bottomPromptContext';
import { BottomPromptOptions, BottomPromptRenderApi } from './types';

export function BottomPromptProvider({ children }: { children: ReactNode }) {
  const [renderContent, setRenderContent] = useState<
    ((api: BottomPromptRenderApi) => ReactNode) | null
  >(null);

  const [options, setOptions] = useState<BottomPromptOptions>({
    hideCloseButton: true,
  });

  const closeBottomPrompt = useCallback(() => {
    setRenderContent(null);
  }, []);

  const showBottomPrompt = useCallback(
    (
      render: (api: BottomPromptRenderApi) => ReactNode,
      opts?: BottomPromptOptions
    ) => {
      setOptions({
        hideCloseButton: opts?.hideCloseButton ?? false,
      });

      setRenderContent(() => render);
    },
    []
  );

  return (
    <BottomPromptContext.Provider
      value={{
        showBottomPrompt,
        closeBottomPrompt,
      }}
    >
      {children}

      {renderContent && (
        <BottomPrompt
          onRequestClose={closeBottomPrompt}
          hideCloseButton={options.hideCloseButton}
        >
          {renderContent({ close: closeBottomPrompt })}
        </BottomPrompt>
      )}
    </BottomPromptContext.Provider>
  );
}
