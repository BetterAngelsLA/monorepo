import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import * as React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IMainModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  actions: {
    title: string;
    route: string;
    Icon: React.ElementType;
  }[];
  bottomSection?: React.ReactNode;
  topSection?: React.ReactNode;
  closeButton?: boolean;
}

export default function MainModal(props: IMainModalProps) {
  const {
    isModalVisible,
    closeModal,
    actions,
    bottomSection,
    topSection,
    closeButton,
  } = props;

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const statusBarHeight = insets.top;
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isModalVisible}
      onRequestClose={closeModal}
    >
      <View
        style={{
          flex: 1,
          paddingTop: statusBarHeight,
          paddingHorizontal: Spacings.sm,
          paddingBottom: 35 + bottomOffset,
        }}
      >
        {closeButton && (
          <Pressable
            style={{ marginLeft: 'auto' }}
            accessible
            accessibilityHint="closes the modal"
            accessibilityRole="button"
            accessibilityLabel="close"
            onPress={closeModal}
          >
            <XmarkIcon size="md" color={Colors.BLACK} />
          </Pressable>
        )}
        <View style={styles.modalOverlay}>
          {topSection}
          {actions.map((action, idx: number) => (
            <Pressable
              accessibilityRole="button"
              key={idx}
              style={styles.container}
            >
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                    backgroundColor: pressed
                      ? Colors.NEUTRAL_EXTRA_LIGHT
                      : Colors.WHITE,
                    borderRadius: 8,
                    paddingHorizontal: Spacings.sm,
                    paddingVertical: Spacings.sm,
                  }}
                >
                  <action.Icon
                    style={{ marginRight: Spacings.md }}
                    color={Colors.PRIMARY_EXTRA_DARK}
                  />

                  <BodyText ml="xs" color={Colors.PRIMARY_EXTRA_DARK}>
                    {action.title}
                  </BodyText>
                </View>
              )}
            </Pressable>
          ))}
          {bottomSection}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    position: 'relative',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
