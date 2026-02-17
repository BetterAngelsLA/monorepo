import { DeleteIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { ClientNavMenuBtn } from './ClientNavMenuBtn';
// ClientNavMenuContent.tsx

type TProps = {
  onDeleteClick: () => void;
  isDeleting?: boolean;
};

export function ClientNavMenuContent({ onDeleteClick, isDeleting }: TProps) {
  return (
    <ClientNavMenuBtn
      disabled={isDeleting}
      text="Delete Profile"
      accessibilityHint="delete client profile"
      color={Colors.ERROR}
      icon={<DeleteIcon color={Colors.ERROR} size="sm" />}
      onPress={onDeleteClick}
    />
  );
}
