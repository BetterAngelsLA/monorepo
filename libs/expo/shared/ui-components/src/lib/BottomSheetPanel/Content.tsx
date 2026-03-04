import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

export default function BottomSheetPanelContent({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <BottomSheetScrollView contentContainerStyle={styles.container}>
      {children}
    </BottomSheetScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacings.lg,
  },
});
