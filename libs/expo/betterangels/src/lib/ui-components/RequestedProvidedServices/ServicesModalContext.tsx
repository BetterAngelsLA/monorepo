import React, { createContext, useContext, useState } from 'react';
import { ServiceRequestTypeEnum } from '../../apollo';

interface ServicesModalContextType {
  setModalContent: (content: {
    type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
    noteId: string;
    initialServices: any[];
    refetch: () => void;
  }) => void;
  modalContent: {
    type: ServiceRequestTypeEnum.Provided | ServiceRequestTypeEnum.Requested;
    noteId: string;
    initialServices: any[];
    refetch: () => void;
  } | null;
}

const ServicesModalContext = createContext<ServicesModalContextType | undefined>(undefined);

export const ServicesModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modalContent, setModalContent] = useState<ServicesModalContextType['modalContent']>(null);

  return (
    <ServicesModalContext.Provider value={{ setModalContent, modalContent }}>
      {children}
    </ServicesModalContext.Provider>
  );
};

export const useServicesModal = () => {
  const context = useContext(ServicesModalContext);
  if (!context) {
    throw new Error('useServicesModal must be used within ServicesModalProvider');
  }
  return context;
};
