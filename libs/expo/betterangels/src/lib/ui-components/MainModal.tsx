import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { BodyText } from '@monorepo/expo/shared/ui-components';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { hexToRGBA } from '../helpers';
import React = require('react');

interface IMainModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  actions: {
    title: string;
    route: string;
    Icon: React.ElementType;
  }[];
}

export default function MainModal(props: IMainModalProps) {
  const { isModalVisible, closeModal, actions } = props;
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <Pressable onPress={closeModal} style={styles.closeIcon}>
          <XmarkIcon color={Colors.WHITE} />
        </Pressable>
        <View style={styles.content}>
          {actions.map((action, idx: number) => (
            <Pressable key={idx} style={styles.container}>
              {({ pressed }) => (
                <>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: pressed
                          ? Colors.PRIMARY
                          : Colors.WHITE,
                      },
                    ]}
                  >
                    <action.Icon
                      color={pressed ? Colors.WHITE : Colors.PRIMARY_EXTRA_DARK}
                    />
                  </View>
                  <BodyText
                    ml="xs"
                    color={pressed ? Colors.PRIMARY : Colors.WHITE}
                  >
                    {action.title}
                  </BodyText>
                </>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: hexToRGBA(Colors.SECONDARY_EXTRA_DARK, 0.97),
    position: 'relative',
  },
  content: {
    width: '100%',
    maxWidth: 214,
    marginLeft: 'auto',
    marginRight: 'auto',
    justifyContent: 'center',
    flex: 1,
  },
  closeIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    height: 56,
    width: 56,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacings.sm,
    maxWidth: 214,
  },
});
