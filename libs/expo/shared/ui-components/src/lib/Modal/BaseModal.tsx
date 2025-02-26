import { Colors } from '@monorepo/expo/shared/static';
import { PropsWithChildren } from 'react';
import { Modal, SafeAreaView } from 'react-native';
import { ModalHeader } from './ModalHeader';

export interface IFileViewerModal extends PropsWithChildren {
  title?: string | null;
  isOpen: boolean;
  setIsOpen?: (open: boolean) => void;
  onClose?: () => void;
}

export function BaseModal(props: IFileViewerModal) {
  const { title, isOpen, setIsOpen, onClose, children } = props;

  function onModalClose() {
    onClose && onClose();

    setIsOpen && setIsOpen(false);
  }

  return (
    <Modal
      style={{
        backgroundColor: Colors.WHITE,
      }}
      visible={isOpen}
      animationType="slide"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ModalHeader onClose={onModalClose} title={title} />
        {children}
      </SafeAreaView>
    </Modal>
  );
}
