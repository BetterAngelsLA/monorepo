import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactElement, cloneElement, useEffect, useRef, useState } from 'react';
import type { ButtonProps, GestureResponderEvent } from 'react-native';
import { View } from 'react-native';
import BasicModal from '../BasicModal';
import Button from '../Button';
import TextBold from '../TextBold';
import TextButton from '../TextButton';
import TextRegular from '../TextRegular';

type TProps = {
  title: string;
  body?: string;
  onDelete: () => void;
  onCancel?: () => void;
  button?: ReactElement<ButtonProps>;
  isVisible?: boolean;
  deleteableItemName?: string;
};

export default function DeleteModal(props: TProps) {
  const {
    title,
    body,
    onCancel,
    onDelete,
    button,
    deleteableItemName,
    isVisible = false,
  } = props;

  const [visible, setVisible] = useState(isVisible);

  // A delete-initiated close must not re-run onCancel, which races with the
  // caller unmounting the modal and can briefly re-present the underlying
  // sheet (e.g. DocumentModal's MainModal).
  const deletingRef = useRef(false);

  useEffect(() => {
    setVisible(isVisible);
  }, [isVisible]);

  const handleClose = () => {
    setVisible(false);

    if (!deletingRef.current) {
      onCancel?.();
    }
  };

  const handleDelete = () => {
    deletingRef.current = true;
    onDelete();
    setVisible(false);
  };

  const clonedButton =
    button &&
    cloneElement(button, {
      onPress: (e: GestureResponderEvent) => {
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
              accessibilityHint="cancel the delete action"
              testId="delete-modal-cancel-btn"
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
              testID="delete-modal-confirm-btn"
              accessibilityHint={
                deleteableItemName ? `delete ${deleteableItemName}` : 'delete'
              }
              variant="primary"
              size="full"
              fontSize="sm"
              onPress={handleDelete}
            />
          </View>
        </View>
      </BasicModal>
    </>
  );
}
