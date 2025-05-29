import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// import modal content components
import ServicesComponent from './modals/ServicesComponent';

// registry/mapping object
const modalRegistry: Record<string, React.ComponentType> = {
  PROVIDED: ServicesComponent,
  REQUESTED: ServicesComponent,
};

export default function BaseModalScreen() {
  const { type } = useLocalSearchParams();

  // select component from registry, or use a fallback
  const ModalContent = modalRegistry[String(type)] || (() => <></>);

  return <ModalContent />;
}
