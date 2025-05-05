import { Colors } from '@monorepo/expo/shared/static';
import { DeleteModal, TextButton } from '@monorepo/expo/shared/ui-components';

type TProps = {
  deleteableItemName: string;
  deleteableItemNameBody?: string;
  onDelete: () => void;
  disabled?: boolean;
};

export function DeleteButton(props: TProps) {
  const { deleteableItemName, deleteableItemNameBody, disabled, onDelete } =
    props;

  return (
    <DeleteModal
      title={`Delete ${deleteableItemName}?`}
      body={`All data associated with this ${
        deleteableItemNameBody || deleteableItemName
      } will be deleted.`}
      onDelete={onDelete}
      deleteableItemName={deleteableItemName}
      button={
        <TextButton
          disabled={disabled}
          mt="md"
          mb="lg"
          fontSize="md"
          color={Colors.ERROR}
          accessibilityHint={`delete ${deleteableItemName}`}
          title={`Delete this ${deleteableItemName}`}
        />
      }
    />
  );
}
