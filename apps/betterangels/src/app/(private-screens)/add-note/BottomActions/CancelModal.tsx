import { Colors } from '@monorepo/expo/shared/static';
import {
  BasicModal,
  BodyText,
  Button,
  TextButton,
} from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

export default function CancelModal() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  function cancelNote() {
    router.back();
    setVisible(false);
  }
  return (
    <>
      <TextButton
        fontSize="sm"
        onPress={() => setVisible(true)}
        accessibilityHint="cancels note creation"
        title="Cancel"
      />
      <BasicModal visible={visible} setVisible={setVisible}>
        <BodyText mb="md">
          Are you sure you want to cancel? All of your progress will be lost.
        </BodyText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TextButton
            fontSize="sm"
            onPress={cancelNote}
            color={Colors.ERROR}
            accessibilityHint="cancels note creation"
            title="Cancel"
          />
          <Button
            size="sm"
            accessibilityHint="continue to work on adding note"
            onPress={() => setVisible(false)}
            variant="primary"
            title="Continue"
          />
        </View>
      </BasicModal>
    </>
  );
}
