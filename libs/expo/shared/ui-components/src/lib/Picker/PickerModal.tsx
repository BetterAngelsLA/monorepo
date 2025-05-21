import { Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  Modal,
  ModalProps,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { PickerItem } from './PickerItem';
import { NONE_VALUE } from './constants';
import { TPickerItem } from './types';

type TProps = {
  visible?: boolean;
  items: TPickerItem[];
  onClose: () => void;
  onSelect: (newValue: string) => void;
  animationType?: ModalProps['animationType'];
  dismissOnBackdropPress?: boolean;
  allowSelectNone?: boolean;
  selectNoneLabel?: string;
};

export function PickerModal(props: TProps) {
  const {
    items,
    visible,
    onSelect,
    onClose,
    animationType = 'fade',
    allowSelectNone,
    selectNoneLabel = 'Select',
  } = props;

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent={true}
      hardwareAccelerated={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View style={styles.content}>
            <ScrollView
              contentContainerStyle={styles.scrollWrap}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!!allowSelectNone && (
                <PickerItem
                  value={NONE_VALUE}
                  displayValue={selectNoneLabel}
                  onPress={onSelect}
                />
              )}
              {items.map((item) => (
                <PickerItem
                  key={item.value}
                  value={item.value}
                  displayValue={item.displayValue}
                  onPress={onSelect}
                />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: Spacings.md,
  },
  scrollWrap: {
    width: '100%',
    flexGrow: 1,
    padding: Spacings.sm,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: Radiuses.sm,
  },
});
