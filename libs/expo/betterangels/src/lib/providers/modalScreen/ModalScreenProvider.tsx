import { usePathname, useRouter } from 'expo-router';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ModalScreenContext } from './ModalScreenContext';
import type {
  IModalScreenState,
  TModalPresentationType,
  TRenderContentApi,
  TShowModalScreenProps,
  noOpFn,
} from './types';

const DEFAULT_PRESENTATION: TModalPresentationType = 'modal';
const SCREEN_PATH_NAME = '/modal-screen';

const DEFAULT_MODAL_STATE: IModalScreenState = {
  presentation: DEFAULT_PRESENTATION,
  title: '',
  hideHeader: false,
  renderContent: null,
};

export const ModalScreenProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const onCloseCallbackRef = useRef<noOpFn | null>(null);
  const isOpeningOrOpenRef = useRef(false);
  const prevPathRef = useRef(pathname);

  const [modal, setModal] = useState<IModalScreenState>(DEFAULT_MODAL_STATE);

  // fires onClose callback based on pathname change
  useEffect(() => {
    const modalWasOpen = prevPathRef.current === SCREEN_PATH_NAME;
    const changedToClosed = modalWasOpen && pathname !== SCREEN_PATH_NAME;

    if (changedToClosed) {
      isOpeningOrOpenRef.current = false;

      try {
        onCloseCallbackRef.current?.();
      } catch (e) {
        console.error('[ModalScreenProvider] onClose handler error:', e);
      }

      onCloseCallbackRef.current = null;

      setModal(DEFAULT_MODAL_STATE);
    }

    prevPathRef.current = pathname;
  }, [pathname]);

  const closeModal = useCallback(() => {
    const currentPath = prevPathRef.current;

    if (currentPath !== SCREEN_PATH_NAME) {
      console.warn(
        `[ModalScreenProvider close] closing modal when pathname is ${currentPath}.`
      );
    }

    router.dismiss();
  }, [router]);

  const showModalScreen = useCallback(
    (props: TShowModalScreenProps) => {
      const { renderContent, presentation, title, hideHeader, onClose } = props;

      setModal({
        renderContent,
        presentation: presentation ?? DEFAULT_PRESENTATION,
        title: title ?? '',
        hideHeader: !!hideHeader,
      });

      onCloseCallbackRef.current = onClose ?? null;

      if (isOpeningOrOpenRef.current) {
        return;
      }

      isOpeningOrOpenRef.current = true;

      router.push(SCREEN_PATH_NAME);
    },
    [router]
  );

  const api: TRenderContentApi = useMemo(
    () => ({
      close: closeModal,
    }),
    [closeModal]
  );

  const resolvedContent = useMemo(() => {
    if (!modal.renderContent) {
      return null;
    }

    try {
      return modal.renderContent(api);
    } catch (e) {
      console.error('[ModalScreenProvider] renderContent error:', e);
      return null;
    }
  }, [modal.renderContent, api]);

  return (
    <ModalScreenContext.Provider
      value={{
        showModalScreen,
        presentation: modal.presentation,
        content: resolvedContent,
        hideHeader: modal.hideHeader,
        title: modal.title,
      }}
    >
      {children}
    </ModalScreenContext.Provider>
  );
};
