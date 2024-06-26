import { XmarkIcon } from '@monorepo/expo/shared/icons';
import { Colors, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { DimensionValue, Pressable, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IMainModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  actions: {
    title: string;
    route: string;
    Icon: React.ElementType;
    params?: {
      title: string;
      select: string;
    };
  }[];
  bottomSection?: React.ReactNode;
  topSection?: React.ReactNode;
  closeButton?: boolean;
  opacity?: number;
  vertical?: boolean;
  ml?: number;
  height?: DimensionValue;
}

export default function MainModal(props: IMainModalProps) {
  const {
    isModalVisible,
    closeModal,
    actions,
    bottomSection,
    topSection,
    closeButton,
    opacity = 0,
    vertical = false,
    ml = 0,
    height = 'auto',
  } = props;

  const router = useRouter();

  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom;
  const topOffset = insets.top;
  return (
    <Modal
      style={{
        margin: 0,
        marginLeft: ml,
        flex: 1,
        justifyContent: 'flex-end',
      }}
      animationIn={vertical ? 'slideInUp' : 'slideInRight'}
      animationOut={vertical ? 'slideOutDown' : 'slideOutRight'}
      backdropOpacity={opacity}
      useNativeDriverForBackdrop={true}
      isVisible={isModalVisible}
      onBackdropPress={closeModal}
    >
      <View
        style={{
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          paddingTop: topOffset + Spacings.xs,
          paddingHorizontal: Spacings.md,
          paddingBottom: 35 + bottomOffset,
          backgroundColor: Colors.WHITE,
          height,
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
              onPress={() => {
                closeModal();
                router.navigate({
                  pathname: action.route,
                  params: action.params,
                });
              }}
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

                  <TextRegular color={Colors.PRIMARY_EXTRA_DARK}>
                    {action.title}
                  </TextRegular>
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
