import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { ReactElement, cloneElement, useEffect, useState } from 'react';
import { ButtonProps, View } from 'react-native';
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
    isVisible,
    title,
    body,
    onCancel,
    onDelete,
    button,
    deleteableItemName,
  } = props;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!!isVisible);
  }, [isVisible]);

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
              onPress={async () => {
                onCancel && onCancel();
                setVisible(false);
              }}
              color={Colors.PRIMARY}
              accessibilityHint="cancel the delete action"
              title="Cancel"
            />
          </View>
          <View style={{ flex: 1, marginLeft: Spacings.xs }}>
            <Button
              fontSize="sm"
              size="full"
              accessibilityHint={
                deleteableItemName ? `delete ${deleteableItemName}` : 'delete'
              }
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
