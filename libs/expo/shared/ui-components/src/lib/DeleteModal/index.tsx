import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactElement, cloneElement, useState } from 'react';
import { ButtonProps, View } from 'react-native';
import BasicModal from '../BasicModal';
import Button from '../Button';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

export default function DeleteModal({
  title,
  body,
  onDelete,
  button,
}: {
  title: string;
  body?: string;
  onDelete: () => void;
  button: ReactElement;
}) {
  const [visible, setVisible] = useState(false);

  const clonedButton = cloneElement(button as ReactElement<ButtonProps>, {
    onPress: () => {
      setVisible(true);
      if (button.props.onPress) {
        button.props.onPress();
      }
    },
  });

  return (
    <>
      {clonedButton}
      <BasicModal visible={visible} onClose={() => setVisible(false)}>
        <TextBold size="lg">{title}</TextBold>
        {body && (
          <TextRegular size="sm" mt="sm">
            {body}
          </TextRegular>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: Spacings.lg,
          }}
        >
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <TextButton
              fontSize="sm"
              onPress={() => setVisible(false)}
              color={Colors.PRIMARY}
              accessibilityHint="continue to work on the interaction"
              title="Cancel"
            />
          </View>
          <View style={{ flex: 1, marginLeft: Spacings.xs }}>
            <Button
              fontSize="sm"
              size="full"
              accessibilityHint="deletes the interaction"
              onPress={async () => {
                onDelete();
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
