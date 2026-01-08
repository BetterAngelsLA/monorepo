import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { useRouter } from 'expo-router';
import { ElementType, Fragment, ReactNode, isValidElement } from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BaseModal } from '@monorepo/expo/shared/ui-components';
import { MainModalActionBtn } from './MainModalActionBtn';
import { MainModalCloseBtn } from './MainModalCloseBtn';

export type TMainModalAction = {
  title: string | ReactNode;
  Icon: ElementType;
  route?: string;
  params?: Record<string, string>;
  onPress?: () => void;
};

interface IMainModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  actions: (TMainModalAction | ReactNode)[];
  bottomSection?: ReactNode;
  topSection?: ReactNode;
  closeButton?: boolean;
  /** Backdrop opacity (0–1) */
  opacity?: number;
  /** When false, slide from right (drawer). When true, slide up (bottom sheet). */
  vertical?: boolean;
  /** Left margin for right-drawer partial width */
  ml?: number;
  /** Fixed height or 'auto' */
  height?: DimensionValue;
}

export function MainModal({
  isModalVisible,
  closeModal,
  actions,
  bottomSection,
  topSection,
  closeButton,
  opacity = 0, // match original default
  vertical = false, // match original default
  ml = 0,
  height = 'auto',
}: IMainModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <BaseModal
      title={null}
      isOpen={isModalVisible}
      onClose={closeModal}
      variant="sheet"
      direction={vertical ? 'up' : 'right'}
      panelOffset={ml}
      backdropOpacity={opacity}
      panelStyle={{
        borderTopLeftRadius: Radiuses.xs,
        borderTopRightRadius: Radiuses.xs,
        backgroundColor: Colors.WHITE,
        height,
      }}
      contentStyle={{
        paddingTop: insets.top + Spacings.xs,
        paddingHorizontal: Spacings.md,
        paddingBottom: 35 + insets.bottom,
      }}
    >
      {closeButton && <MainModalCloseBtn onPress={closeModal} />}

      <View style={styles.modalOverlay}>
        {topSection}

        {actions.map((action, idx: number) => {
          if (isValidElement(action)) {
            return <Fragment key={idx}>{action}</Fragment>;
          }

          const { title, route, params, Icon, onPress } =
            action as TMainModalAction;

          return (
            <MainModalActionBtn
              key={idx}
              title={title}
              Icon={Icon}
              onPress={() => {
                if (onPress) return onPress();
                // Original behavior: close then navigate immediately
                closeModal();
                if (route) router.navigate({ pathname: route, params });
              }}
            />
          );
        })}

        {bottomSection}
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});

export default MainModal;
