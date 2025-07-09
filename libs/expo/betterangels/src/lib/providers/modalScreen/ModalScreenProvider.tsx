import { usePathname, useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ModalScreenContext } from './ModalScreenContext';
import { TModalPresentationType, TShowModalScreenProps } from './types';

/**
 * ModalScreenProvider
 *
 * Wrap the app with this provider to enable showing and closing
 * a global modal screen via context.
 *
 * @example
 * <ModalScreenProvider>
 *   // your app components and <Stack> navigator here
 * </ModalScreenProvider>
 *
 * showModalScreen({
 *  presentation: 'modal',
 *  hideHeader: true,
 *  content: (
 *     <MyComponent />
 *   ),
 * })
 */

const DEFAULT_PRESENTATION: TModalPresentationType = 'modal';
const SCREEN_PATH_NAME = '/modal-screen';

export const ModalScreenProvider = ({ children }: { children: ReactNode }) => {
  const [presentation, setPresentation] =
    useState<TModalPresentationType>(DEFAULT_PRESENTATION);
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(
    null
  );
  const [onCloseHandler, setOnCloseHandler] = useState<(() => void) | null>(
    null
  );
  const [title, setTitle] = useState<string>('');
  const [noHeader, setNoHeader] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  const showModalScreen = (props: TShowModalScreenProps) => {
    const { content, presentation, title, hideHeader, onClose } = props;

    setModalContent(content);
    setPresentation(presentation || DEFAULT_PRESENTATION);
    setTitle(title || '');
    setNoHeader(!!hideHeader);
    setOnCloseHandler(() => onClose ?? null);

    router.push(SCREEN_PATH_NAME);
  };

  // Auto modal close detection:
  // Effect listens for route changes and detects when the modal route is exited.
  // When exiting, it invokes the onClose handler (if any) and resets modal state.
  useEffect(() => {
    if (modalContent !== null && pathname !== SCREEN_PATH_NAME) {
      onCloseHandler?.();

      setModalContent(null);
      setOnCloseHandler(null);
    }
  }, [pathname]);

  // Manual modal close method
  const closeModalScreen = () => {
    if (pathname !== SCREEN_PATH_NAME) {
      console.warn(
        `ModalScreenProvider: attempting to close modalScreen when path is ${SCREEN_PATH_NAME}`
      );

      return;
    }

    onCloseHandler ? onCloseHandler() : router.back();
  };

  return (
    <ModalScreenContext.Provider
      value={{
        showModalScreen,
        closeModalScreen,
        presentation,
        content: modalContent,
        hideHeader: noHeader,
        title,
      }}
    >
      {children}
    </ModalScreenContext.Provider>
  );
};
