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
      {modalContent}
    </View>
    </KeyboardToolbarProvider>
  );
}
