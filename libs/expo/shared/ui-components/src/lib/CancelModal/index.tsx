import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import BasicModal from '../BasicModal';
import BodyText from '../BodyText';
import Button from '../Button';
import H1 from '../H1';
import TextButton from '../TextButton';

export default function CancelModal({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
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
        accessibilityHint="cancels creation"
        title="Cancel"
      />
      <BasicModal visible={visible} setVisible={setVisible}>
        <H1 mb="sm">{title}</H1>
        <BodyText mb="md">{body}</BodyText>
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
              accessibilityHint="continue to work on the note"
              title="Cancel"
            />
          </View>
          <View style={{ flex: 1, marginLeft: Spacings.xs }}>
            <Button
              size="full"
              accessibilityHint="deletes the note"
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
