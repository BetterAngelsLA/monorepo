import {
  KeyboardToolbarProvider,
  useModalScreen,
} from '@monorepo/expo/betterangels';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { View } from 'react-native';

export default function BaseModalScreen() {
  const { modalContent, closeModalScreen, presentation } = useModalScreen();

  console.log(
    '################################### BASE-MODAL-SCREEN: ',
    presentation
  );

  if (!modalContent) {
    console.log('############################ BASE-MODAL-SCREEN: NO CONTENT');

    return null;
  }

  return (
    <KeyboardToolbarProvider>
      <View
        style={{
          flex: 1,
          backgroundColor: 'white',
          paddingVertical: 55,
          paddingHorizontal: 55,
          borderWidth: 4,
          borderColor: 'red',
        }}
      >
        <View
          style={{
            paddingVertical: 15,
            borderWidth: 2,
            borderColor: 'blue',
            marginBottom: 45,
          }}
        >
          <TextRegular onPress={closeModalScreen}>close</TextRegular>
        </View>
        {modalContent}
      </View>
    </KeyboardToolbarProvider>
  );
}
