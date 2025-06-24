import { usePathname, useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ModalScreenContext } from './ModalScreenContext';
import { TModalPresentationType, TShowModalScreenProps } from './types';

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

  const closeModalScreen = () => {
    if (pathname !== SCREEN_PATH_NAME) {
      console.warn(
        `ModalScreenProvider: attempting to close modalScreen when path is ${SCREEN_PATH_NAME}`
      );

      return;
    }

    router.back();
  };

  useEffect(() => {
    if (modalContent !== null && pathname !== SCREEN_PATH_NAME) {
      onCloseHandler?.();

      setModalContent(null);
      setOnCloseHandler(null);
    }
  }, [pathname]);

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
