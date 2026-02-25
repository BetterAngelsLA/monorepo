import { Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useEffect, useRef } from 'react';
import {
  Modal,
  ModalProps,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextBold from '../TextBold';
import { PickerItem } from './PickerItem';
import { NONE_VALUE } from './constants';
import { TPickerItem } from './types';

type TProps = {
  visible?: boolean;
  items: TPickerItem[];
  selectedValue?: string | null;
  onClose: () => void;
  onSelect: (newValue: string) => void;
  onAfterClose?: () => void;
  animationType?: ModalProps['animationType'];
  dismissOnBackdropPress?: boolean;
  allowSelectNone?: boolean;
  selectNoneLabel?: string;
  title?: string;
};

export function PickerModal(props: TProps) {
  const {
    items,
    selectedValue,
    visible,
    onSelect,
    onClose,
    onAfterClose,
    animationType = 'fade',
    allowSelectNone,
    selectNoneLabel = 'Select',
    title,
  } = props;

  const wasVisibleRef = useRef<boolean>(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (wasVisibleRef.current && !visible) {
        onAfterClose?.();
      }
    }

    wasVisibleRef.current = !!visible;
  }, [visible, onAfterClose]);

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={onClose}
      onDismiss={() => {
        onAfterClose?.();
      }} // iOS only
    >
      <View style={styles.fullscreen}>
        {/* Full-screen dimmed backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Close picker"
          accessibilityHint="Closes the picker modal"
        />

        {/* Layout container (centering + padding), sits ABOVE backdrop */}
        <View style={styles.centerWrap}>
          <SafeAreaView style={styles.content}>
            <ScrollView
              contentContainerStyle={styles.scrollWrap}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {title && <TextBold size="sm">{title}</TextBold>}
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
                  isSelected={item.value === selectedValue}
                  onPress={onSelect}
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacings.md,
  },
  content: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: Radiuses.xs,
    overflow: 'hidden',
  },
  scrollWrap: {
    width: '100%',
    flexGrow: 1,
    padding: Spacings.sm,
  },
});
