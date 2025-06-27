import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactElement, cloneElement, useEffect, useState } from 'react';
import type { ButtonProps } from 'react-native';
import { View } from 'react-native';
import BasicModal from '../BasicModal';
import Button from '../Button';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

export type DeleteModalProps = {
  title: string;
  body?: string;
  onDelete: () => void;
  onCancel?: () => void;
  button?: ReactElement<ButtonProps>;
  isVisible?: boolean;
};

export default function DeleteModal({
  title,
  body,
  onCancel,
  onDelete,
  button,
  isVisible = false,
}: DeleteModalProps) {
  const [visible, setVisible] = useState(isVisible);

  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  const handleClose = () => {
    setVisible(false);
    onCancel?.();
  };

  const clonedButton =
    button &&
    cloneElement(button, {
      onPress: (e) => {
        setVisible(true);
        button.props.onPress?.(e);
      },
    });

  return (
    <>
      {clonedButton}
      <BasicModal visible={visible} onClose={handleClose}>
        <TextBold size="lg">{title}</TextBold>
        {body && (
          <TextRegular size="sm" style={{ marginTop: Spacings.sm }}>
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
              title="Cancel"
              accessibilityHint="Cancel deletion"
              color={Colors.PRIMARY}
              fontSize="sm"
              onPress={() => {
                onCancel?.();
                setVisible(false);
              }}
            />
          </View>
          <View style={{ flex: 1, marginLeft: Spacings.xs }}>
            <Button
              title="Delete"
              accessibilityHint="Confirm deletion"
              variant="primary"
              size="full"
              fontSize="sm"
              onPress={() => {
                onDelete();
                setVisible(false);
              }}
            />
          </View>
        </View>
      </BasicModal>
    </>
  );
}
