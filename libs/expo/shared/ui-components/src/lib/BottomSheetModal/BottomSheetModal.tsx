import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet';
import {
  Colors,
  Radiuses,
  Shadow,
  Spacings,
} from '@monorepo/expo/shared/static';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheetModalContent from './Content';

interface IBottmomSheetModalProps extends BottomSheetProps {
  title?: string | null;
  children: ReactNode;
}

export function BottomSheetModal(props: IBottmomSheetModalProps) {
  const { title, children, snapPoints: externalSnapPoints, ...rest } = props;
  const [titleHeight, setTitleHeight] = useState<number>(1);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => [titleHeight], [titleHeight]);

  return (
    <BottomSheet
      {...rest}
      index={0}
      handleIndicatorStyle={{
        backgroundColor: Colors.NEUTRAL_LIGHT,
        width: 54,
        height: 5,
        borderRadius: Radiuses.xxs,
      }}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      ref={bottomSheetRef}
      enableDynamicSizing
      style={styles.shadow}
    >
      <BottomSheetModalContent title={title} setTitleHeight={setTitleHeight}>
        {children}
      </BottomSheetModalContent>
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
});
