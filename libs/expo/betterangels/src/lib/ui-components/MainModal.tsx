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
  transparent?: boolean;
}

export default function MainModal(props: IMainModalProps) {
  const {
    isModalVisible,
    closeModal,
    actions,
    bottomSection,
    topSection,
    closeButton,
    transparent = false,
  } = props;

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  return (
    <Modal
      animationType="slide"
      transparent={transparent}
      visible={isModalVisible}
      onRequestClose={closeModal}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            paddingTop: Spacings.md,
            paddingHorizontal: Spacings.md,
            paddingBottom: 35 + bottomOffset,
            backgroundColor: Colors.WHITE,
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
                    <View
                      style={{
                        marginRight: Spacings.sm,
                        height: 40,
                        width: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <action.Icon color={Colors.PRIMARY_EXTRA_DARK} />
                    </View>

                    <BodyText color={Colors.PRIMARY_EXTRA_DARK}>
                      {action.title}
                    </BodyText>
                  </View>
                )}
              </Pressable>
            ))}
            {bottomSection}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
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
