import { Colors, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicModal,
  BodyText,
  Button,
  H1,
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
        <H1 mb="sm">Are you sure?</H1>
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
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <TextButton
              fontSize="sm"
              onPress={() => setVisible(false)}
              color={Colors.PRIMARY}
              accessibilityHint="cancels note creation"
              title="Cancel"
            />
          </View>
          <View style={{ flex: 1, marginLeft: Spacings.xs }}>
            <Button
              size="full"
              accessibilityHint="continue to work on adding note"
              onPress={cancelNote}
              variant="primary"
              title="Delete"
            />
          </View>
        </View>
      </BasicModal>
    </>
  );
}
