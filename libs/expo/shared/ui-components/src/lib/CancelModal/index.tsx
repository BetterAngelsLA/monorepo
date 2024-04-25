import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { View } from 'react-native';
import BasicModal from '../BasicModal';
import Button from '../Button';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

export default function CancelModal({
  title,
  body,
  onDelete,
}: {
  title: string;
  body: string;
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
        <TextBold size="xl" mb="sm">
          {title}
        </TextBold>
        <TextRegular mb="md">{body}</TextRegular>
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
