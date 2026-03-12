import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactElement, cloneElement, useState } from 'react';
import type { ButtonProps, GestureResponderEvent } from 'react-native';
import { View } from 'react-native';
import BasicModal from '../BasicModal';
import Button from '../Button';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

type TProps = {
  title: string;
  body: string;
  onDiscard: () => void;
  button: ReactElement<ButtonProps>;
};

export default function DiscardModal({
  title,
  body,
  onDiscard,
  button,
}: TProps) {
  const [visible, setVisible] = useState(false);

  const clonedButton = cloneElement(button, {
    onPress: (e: GestureResponderEvent) => {
      setVisible(true);
      button.props.onPress?.(e);
    },
  });

  return (
    <>
      {clonedButton}
      <BasicModal visible={visible} onClose={() => setVisible(false)}>
        <TextBold size="lg">{title}</TextBold>
        <TextRegular size="sm" style={{ marginTop: Spacings.sm }}>
          {body}
        </TextRegular>
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
              title="Keep Editing"
              accessibilityHint="dismiss the dialog and continue editing"
              color={Colors.PRIMARY}
              fontSize="sm"
              onPress={() => setVisible(false)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: Spacings.xs }}>
            <Button
              title="Discard"
              accessibilityHint="discard unsaved changes"
              variant="primary"
              size="full"
              fontSize="sm"
              onPress={() => {
                onDiscard();
                setVisible(false);
              }}
            />
          </View>
        </View>
      </BasicModal>
    </>
  );
}
