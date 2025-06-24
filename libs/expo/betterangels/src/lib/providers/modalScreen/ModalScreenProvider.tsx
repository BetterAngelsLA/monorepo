import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { ModalScreenContext } from './ModalScreenContext';
import { TPresentationType } from './types';

const DEFAULT_PRESENTATION: TPresentationType = 'modal';

export const ModalScreenProvider = ({ children }: { children: ReactNode }) => {
  const [presentation, setPresentation] =
    useState<TPresentationType>(DEFAULT_PRESENTATION);

  const [modalContent, setModalContent] = useState<React.ReactNode | null>(
    null
  );
  const router = useRouter();

  const showModalScreen = (
    component: React.ReactNode,
    presentation?: TPresentationType
  ) => {
    setModalContent(component);
    setPresentation(presentation || DEFAULT_PRESENTATION);

    router.push('/base-modal-screen');
  };

  const closeModalScreen = () => {
    console.log('################################### CLOSE MODAL SCREEN');
    // 1. Check if open
    // 2. If open - router.back()
    router.back();
  };

  const clearModalScreen = () => setModalContent(null);

  return (
    <ModalScreenContext.Provider
      value={{
        showModalScreen,
        closeModalScreen,
        modalContent,
        presentation,
        clearModalScreen,
      }}
    >
      {children}
    </ModalScreenContext.Provider>
  );
};
