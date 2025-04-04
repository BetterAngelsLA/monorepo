import { Colors } from '@monorepo/expo/shared/static';
import { Modal, StyleSheet, View } from 'react-native';
import Loading from '../Loading';

type TProps = {
  fullScreen?: boolean;
};

export function FullscreenLoadingModal(props: TProps) {
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      hardwareAccelerated={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Loading size="large" color={Colors.WHITE} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    alignItems: 'center',
  },
});
