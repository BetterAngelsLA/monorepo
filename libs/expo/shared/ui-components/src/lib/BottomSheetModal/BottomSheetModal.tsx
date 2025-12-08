import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { appZIndex } from '@monorepo/react/shared';
import { ReactNode, useRef } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheetModalContent from './Content';

interface IBottmomSheetModalProps extends BottomSheetProps {
  children: ReactNode;
}

export function BottomSheetModal(props: IBottmomSheetModalProps) {
  const { children, ...rest } = props;

  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      style={styles.container}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicatorStyle}
      containerStyle={styles.containerStyle}
      ref={bottomSheetRef}
      {...rest}
    >
      <BottomSheetModalContent>{children}</BottomSheetModalContent>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Spacings.md,
  },
  background: {
    backgroundColor: Colors.WHITE,
    // placing shadow on styles.container gives RCTView warning.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  indicatorStyle: {
    backgroundColor: Colors.NEUTRAL_LIGHT,
    width: 54,
    height: 5,
    borderRadius: Radiuses.xxs,
  },
  containerStyle: {
    zIndex: appZIndex.p3,
  },
});
