import { usePathname, useRouter } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { ModalScreenContext } from './ModalScreenContext';
import { TModalPresentationType, TShowModalScreenProps, noOpFn } from './types';

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
  const router = useRouter();
  const pathname = usePathname();

  const onCloseCallbackRef = useRef<noOpFn | null>(null);
  const prevPathRef = useRef(pathname);

  const [presentation, setPresentation] =
    useState<TModalPresentationType>(DEFAULT_PRESENTATION);
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(
    null
  );
  const [title, setTitle] = useState<string>('');
  const [noHeader, setNoHeader] = useState<boolean>(false);

  const showModalScreen = (props: TShowModalScreenProps) => {
    const { content, presentation, title, hideHeader, onClose } = props;

    setModalContent(content);
    setPresentation(presentation || DEFAULT_PRESENTATION);
    setTitle(title || '');
    setNoHeader(!!hideHeader);
    onCloseCallbackRef.current = onClose ?? null;

    router.push(SCREEN_PATH_NAME);
  };

  // Auto modal close detection:
  // Effect listens for route changes and detects when the modal route is exited.
  // When exiting, it invokes the onClose handler (if any) and resets modal state.
  useEffect(() => {
    const modalWasOpen = prevPathRef.current === SCREEN_PATH_NAME;
    const changedToClosed = modalWasOpen && pathname !== SCREEN_PATH_NAME;

    if (changedToClosed) {
      try {
        onCloseCallbackRef.current?.();
      } catch (e) {
        console.error('[ModalScreenProvider] onClose handler error:', e);
      }

      onCloseCallbackRef.current = null;
      setModalContent(null);
    }

    prevPathRef.current = pathname;
  }, [pathname]);

  // Manual modal close method
  const closeModalScreen = () => {
    if (pathname !== SCREEN_PATH_NAME) {
      console.warn(
        `ModalScreenProvider: attempting to close modalScreen when path is ${SCREEN_PATH_NAME}`
      );

      return;
    }

    router.back();
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
