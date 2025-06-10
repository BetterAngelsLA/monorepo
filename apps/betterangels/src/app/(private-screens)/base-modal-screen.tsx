import { KeyboardToolbarProvider, ServicesModal, useServicesModal } from '@monorepo/expo/betterangels';
import { useRouter } from 'expo-router';

export default function BaseModalScreen() {
  const { modalContent } = useServicesModal();
  const router = useRouter();

  if (!modalContent) return null;

  return (
    <KeyboardToolbarProvider>
      <ServicesModal
        isModalVisible={true}
        setIsModalVisible={(visible) => {
          if (!visible) router.back();
        }}
        noteId={modalContent.noteId}
        type={modalContent.type}
        initialServices={modalContent.initialServices}
        refetch={modalContent.refetch}
      />
    </KeyboardToolbarProvider>
  );
}
