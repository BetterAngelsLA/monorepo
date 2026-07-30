import { DeleteIcon, ThreeDotIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import { useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
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

  const menuBtnTestId = menuVisible
    ? 'client-nav-menu-close-btn'
    : 'client-nav-menu-open-btn';

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="toggle client profile menu"
        testID={menuBtnTestId}
        onPress={() => setMenuVisible((prev) => !prev)}
      >
        {({ pressed }) => (
          <ThreeDotIcon
            size="lg"
            color={pressed ? Colors.NEUTRAL_DARK : Colors.WHITE}
          />
        )}
      </Pressable>

      {menuVisible && (
        <>
          <Pressable
            accessible={false}
            accessibilityRole="none"
            style={{
              position: 'absolute',
              top: -Dimensions.get('window').height,
              left: -Dimensions.get('window').width,
              width: Dimensions.get('window').width * 3,
              height: Dimensions.get('window').height * 3,
              zIndex: 1,
            }}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuDropdown}>
            <ClientNavMenuBtn
              testId="client-nav-menu-delete-profile-btn"
              disabled={isDeleting}
              text="Delete Profile"
              accessibilityHint="delete client profile"
              color={Colors.ERROR}
              icon={<DeleteIcon color={Colors.ERROR} size="sm" />}
              onPress={handleRequestDelete}
            />
          </View>
        </>
      )}

      <DeleteModal
        title="Delete Profile?"
        body="All data associated with this client will be deleted. This action cannot be undone."
        isVisible={deleteVisible}
        onCancel={() => setDeleteVisible(false)}
        onDelete={handleConfirmDelete}
        deleteableItemName="client profile"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 40,
    right: 0,
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    borderRadius: 12,
    elevation: 12,
    zIndex: 2,
    overflow: 'hidden',
  },
});
