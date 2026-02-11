/**
 * BottomPromptProvider
 *
 * Provides global access to the BottomPrompt overlay.
 *
 * Wrap your app (or a subtree) with this provider to enable
 * imperatively showing a bottom sheet from anywhere via context.
 *
 * Usage:
 *   const { showBottomPrompt } = useBottomPrompt();
 *
 *   showBottomPrompt(({ close }) => (
 *     <MyContent onDone={close} />
 *   ), {
 *     sheetHeight: 400,
 *     hideCloseButton: false,
 *   });
 *
 * Behavior:
 * - `showBottomPrompt` mounts the BottomPrompt and renders the provided content.
 * - The `render` function receives a `close` callback for dismissing the sheet.
 * - `onRequestClose` triggers the exit animation.
 * - After the exit animation completes, the sheet is unmounted.
 *
 * This provider ensures:
 * - Only one bottom prompt is rendered at a time.
 * - Content is dynamically injected.
 * - Exit animations complete before unmounting.
 */

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
        sheetHeight: opts?.sheetHeight,
        topNavStyle: opts?.topNavStyle,
        contentStyle: opts?.contentStyle,
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
          sheetHeight={options.sheetHeight}
          topNavStyle={options.topNavStyle}
          contentStyle={options.contentStyle}
        >
          {renderContent({ close: requestClose })}
        </BottomPrompt>
      )}
    </BottomPromptContext.Provider>
  );
}
