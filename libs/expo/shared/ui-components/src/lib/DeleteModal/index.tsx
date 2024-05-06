import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { useState } from 'react';
import { View } from 'react-native';
import BasicModal from '../BasicModal';
import Button from '../Button';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

export default function DeleteModal({
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
      <Button
        onPress={() => setVisible(true)}
        accessibilityHint="initiates deletion"
        title="Delete"
        variant="negative"
        size="full"
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
              accessibilityHint="cancel deletion"
              title="Cancel"
            />
          </View>
          <View style={{ flex: 1, marginLeft: Spacings.xs }}>
            <Button
              size="full"
              accessibilityHint="confirms and performs deletion"
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
