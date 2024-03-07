import { Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { View } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import BasicModal from '../BasicModal';
import BodyText from '../BodyText';
import Button from '../Button';
import H1 from '../H1';
import TextButton from '../TextButton';

export default function CancelModal({
  title,
  body,
  noteId,
  onDelete,
}: {
  title: string;
  body: string;
  noteId: string | undefined;
  onDelete: () => void;
}) {
  const [visible, setVisible] = useState(false);

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
              onPress={async () => {
                await onDelete();
                setVisible(false);
              }}
              variant="primary"
              title="Delete"
            />
          </View>
        </View>
      </BasicModal>
    </>
  );
}
