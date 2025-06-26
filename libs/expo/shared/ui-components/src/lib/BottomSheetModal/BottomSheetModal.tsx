import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet';
import {
  Colors,
  Radiuses,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
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
      handleIndicatorStyle={styles.indicatorStyle}
      ref={bottomSheetRef}
      style={styles.shadow}
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
  shadow: {
    backgroundColor: Colors.WHITE,
    ...Shadow,
  },
  indicatorStyle: {
    backgroundColor: Colors.NEUTRAL_LIGHT,
    width: 54,
    height: 5,
    borderRadius: Radiuses.xxs,
  },
});
