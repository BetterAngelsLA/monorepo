// ClientNavMenu.tsx
import { DeleteIcon, ThreeDotIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';
import { useDeleteClientProfile } from '../ClientProfile/hooks/useDeleteClientProfile';
import { ClientNavMenuBtn } from './ClientNavMenuBtn';

type TProps = {
  clientProfileId?: string;
  onDeleted?: () => void; // optional callback for screen to react after delete
};

export function ClientNavMenu({ clientProfileId, onDeleted }: TProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const { deleteProfile, loading: isDeleting } = useDeleteClientProfile({
    clientProfileId,
  });

  const handleRequestDelete = () => {
    // close tooltip first
    setMenuVisible(false);
    // then show confirm modal
    setDeleteVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientProfileId || isDeleting) return;

    await deleteProfile(clientProfileId);
    setDeleteVisible(false);
    onDeleted?.();
  };

  return (
    <>
      <Tooltip
        isVisible={menuVisible}
        backgroundColor="transparent"
        placement="bottom"
        disableShadow
        onClose={() => setMenuVisible(false)}
        arrowSize={{ width: 0, height: 0 }}
        displayInsets={{ top: 0, bottom: 0, left: 0, right: 12 }}
        tooltipStyle={[
          styles.contentWrapper,
          {
            marginTop: Platform.OS === 'android' ? 14 : 8,
          },
        ]}
        contentStyle={styles.content}
        content={
          <ClientNavMenuBtn
            disabled={isDeleting}
            text="Delete Profile"
            accessibilityHint="delete client profile"
            color={Colors.ERROR}
            icon={<DeleteIcon color={Colors.ERROR} size="sm" />}
            onPress={handleRequestDelete}
          />
        }
      >
        <Pressable
          accessibilityRole="button"
          accessibilityHint="toggle client profile menu"
          onPress={() => setMenuVisible((prev) => !prev)}
        >
          {({ pressed }) => (
            <ThreeDotIcon
              size="lg"
              color={pressed ? Colors.NEUTRAL_DARK : Colors.WHITE}
            />
          )}
        </Pressable>
      </Tooltip>

      {/* This modal is now a sibling of the Tooltip, not inside it */}
      <DeleteModal
        title="Delete Profile?"
        body="All data associated with this client will be deleted. This action cannot be undone."
        isVisible={deleteVisible}
        onCancel={() => setDeleteVisible(false)}
        onDelete={handleConfirmDelete}
        deleteableItemName="client profile"
      />
    </>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    borderRadius: 12,
    elevation: 12,
  },
  content: {
    padding: 0,
    borderRadius: 12,
    height: 'auto',
    overflow: 'hidden',
  },
});
