import { DeleteIcon, ThreeDotIcon } from '@monorepo/expo/shared/icons';
import { Colors } from '@monorepo/expo/shared/static';
import { DeleteModal } from '@monorepo/expo/shared/ui-components';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const btnRef = useRef<View>(null);

  const { deleteProfile, loading: isDeleting } = useDeleteClientProfile({
    clientProfileId,
  });

  const handleOpenMenu = () => {
    btnRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      setMenuPosition({
        top: pageY + (Platform.OS === 'android' ? 38 : 32),
        right: Dimensions.get('window').width - pageX - 24, // 24 = button width
      });
      setMenuVisible(true);
    });
  };

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
        ref={btnRef}
        accessibilityRole="button"
        accessibilityHint="toggle client profile menu"
        testID={menuBtnTestId}
        onPress={handleOpenMenu}
      >
        {({ pressed }) => (
          <ThreeDotIcon
            size="lg"
            color={pressed ? Colors.NEUTRAL_DARK : Colors.WHITE}
          />
        )}
      </Pressable>

      <Modal
        transparent
        visible={menuVisible}
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          accessible={false}
          accessibilityRole="none"
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
        />
        <View
          style={[
            styles.menuDropdown,
            { top: menuPosition.top, right: menuPosition.right },
          ]}
        >
          <View style={styles.menuDropdownInner}>
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
        </View>
      </Modal>

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
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuDropdown: {
    position: 'absolute',
    backgroundColor: Colors.WHITE,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    borderRadius: 12,
    elevation: 12,
  },
  menuDropdownInner: {
    overflow: 'hidden',
    borderRadius: 12,
  },
});
