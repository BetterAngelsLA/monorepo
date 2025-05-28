import { BaseModalLayout } from '@monorepo/expo/shared/ui-components';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

// Import your modal content components
import ServicesComponent from './modals/ServicesComponent';

// Create the registry/mapping object
const modalRegistry: Record<string, React.ComponentType> = {
  PROVIDED: ServicesComponent,
  REQUESTED: ServicesComponent,
  // Add more mappings as needed
};

export default function BaseModalScreen() {
  const { type } = useLocalSearchParams();

  // Select the component from the registry, or use a fallback
  const ModalContent = modalRegistry[String(type)] || (() => <></>);

  return (
    <BaseModalLayout>
      <ModalContent />
    </BaseModalLayout>
  );
}
