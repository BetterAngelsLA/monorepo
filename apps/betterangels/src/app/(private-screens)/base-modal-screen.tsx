import { useModalScreen } from '@monorepo/expo/betterangels';
import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { KeyboardToolbarProvider } from '@monorepo/expo/betterangels';

export default function BaseModalScreen() {
  const { modalContent, clearModalContent } = useModalScreen();
  const router = useRouter();

  if (!modalContent) return null;

  const handleClose = () => {
    clearModalContent();
    router.back();
  };

  return (
    <KeyboardToolbarProvider>
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingBottom: 35,
        paddingTop: 10,
        marginTop: 0,
      }}
    >
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 8 }}>
        <Pressable
          accessible
          accessibilityHint="closes the modal"
          accessibilityRole="button"
          accessibilityLabel="close"
          onPress={handleClose}
        >
          <PlusIcon size="md" color={Colors.BLACK} rotate="45deg" />
        </Pressable>
      </View>
      {modalContent}
    </View>
    </KeyboardToolbarProvider>
  );
}
