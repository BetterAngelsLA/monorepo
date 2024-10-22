import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Modal from './Modal';

interface ICheckboxModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
}

export default function CheckboxModal(props: ICheckboxModalProps) {
  const { isModalVisible, closeModal } = props;

  const router = useRouter();

  return (
    <Modal isModalVisible={isModalVisible} closeModal={closeModal} closeButton>
      {actions.map((action, idx: number) => (
        <Pressable
          onPress={() => {
            if (action.onPress) {
              return action.onPress();
            }
            closeModal();
            action.route &&
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
                borderRadius: Radiuses.xs,
                paddingHorizontal: Spacings.sm,
                paddingVertical: Spacings.sm,
              }}
            >
              <View
                style={{
                  marginRight: Spacings.sm,
                  height: Spacings.xl,
                  width: Spacings.xl,
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
