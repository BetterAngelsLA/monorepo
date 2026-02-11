import { ReactNode, useCallback, useState } from 'react';
import { BottomPrompt } from './BottomPrompt';
import { BottomPromptContext } from './bottomPromptContext';
import { BottomPromptOptions, BottomPromptRenderApi } from './types';

export function BottomPromptProvider({ children }: { children: ReactNode }) {
  const [renderContent, setRenderContent] = useState<
    ((api: BottomPromptRenderApi) => ReactNode) | null
  >(null);

  const [isVisible, setIsVisible] = useState<boolean>(false);

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
        onCloseStart: opts?.onCloseStart,
        onCloseEnd: opts?.onCloseEnd,
      });

      setRenderContent(() => render);
      setIsVisible(true);
    },
    []
  );

  const requestClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const unmountBottomPrompt = useCallback(() => {
    setRenderContent(null);
  }, []);

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
          isVisible={isVisible}
          onRequestClose={requestClose}
          onCloseStart={options.onCloseStart}
          onCloseEnd={() => {
            options.onCloseEnd?.();
            unmountBottomPrompt();
          }}
          hideCloseButton={options.hideCloseButton}
        >
          {renderContent({ close: requestClose })}
        </BottomPrompt>
      )}
    </BottomPromptContext.Provider>
  );
}
