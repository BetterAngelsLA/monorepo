import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Colors, Radiuses } from '@monorepo/expo/shared/static';
import { IconButton } from '@monorepo/expo/shared/ui-components';

export interface IDeleteButton {
  onDelete: () => void;
  accessibilityHint: string;
  disabled?: boolean;
}

export function ThumbnailDeleteButton(props: IDeleteButton) {
  const { onDelete, disabled, accessibilityHint } = props;

  return (
    <IconButton
      disabled={disabled}
      borderColor={Colors.NEUTRAL_LIGHT}
      borderRadius={Radiuses.xxxl}
      onPress={() => onDelete()}
      style={{
        position: 'absolute',
        top: 7,
        right: 7,
        zIndex: 1000,
      }}
      variant="secondary"
      height="xs"
      width="xs"
      accessibilityLabel="delete"
      accessibilityHint={accessibilityHint}
    >
      <PlusIcon rotate="45deg" size={8} color={Colors.PRIMARY_EXTRA_DARK} />
    </IconButton>
  );
}
