import { useContext } from 'react';
import { ModalScreenContext } from './ModalScreenContext';

export const useModalScreen = () => {
  const context = useContext(ModalScreenContext);

  if (!context) {
    throw new Error('useModalScreen must be used within ModalScreenProvider');
  }

  return context;
};
