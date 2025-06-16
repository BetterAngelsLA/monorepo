import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'expo-router';

interface ModalScreenContextType {
  setModalContent: (content: React.ReactNode) => void;
  modalContent: React.ReactNode | null;
  clearModalContent: () => void;
  showModalScreen: (content: React.ReactNode) => void;
}

const ModalScreenContext = createContext<ModalScreenContextType | undefined>(undefined);

export const ModalScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const router = useRouter();

  const clearModalContent = () => setModalContent(null);

  const showModalScreen = (content: React.ReactNode) => {
    setModalContent(content);
    router.push('/base-modal-screen');
  }

  return (
    <ModalScreenContext.Provider value={{ setModalContent, modalContent, clearModalContent, showModalScreen }}>
      {children}
    </ModalScreenContext.Provider>
  );
};

export const useModalScreen = () => {
  const context = useContext(ModalScreenContext);
  if (!context) {
    throw new Error('useModalScreen must be used within ModalScreenProvider');
  }
  return context;
};
