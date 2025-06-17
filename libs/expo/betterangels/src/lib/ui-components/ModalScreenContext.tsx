import { useRouter } from 'expo-router';
import React, { createContext, useContext, useState } from 'react';

interface ModalScreenContextType {
  showModalScreen: (component: React.ReactNode) => void;
  modalContent: React.ReactNode | null;
  clearModalScreen: () => void;
}

const ModalScreenContext = createContext<ModalScreenContextType | undefined>(undefined);

export const ModalScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const router = useRouter();

  const showModalScreen = (component: React.ReactNode) => {
    setModalContent(component);
    router.push('/base-modal-screen');
  };

  const clearModalScreen = () => setModalContent(null);

  return (
    <ModalScreenContext.Provider value={{ showModalScreen, modalContent, clearModalScreen }}>
      {children}
    </ModalScreenContext.Provider>
  );
};

export const useModalScreen = () => {
  const context = useContext(ModalScreenContext);
  if (!context) throw new Error('useModalScreen must be used within ModalScreenProvider');
  return context;
};
