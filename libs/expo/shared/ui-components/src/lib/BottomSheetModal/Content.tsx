import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode } from 'react';

export default function BottomSheetModalContent({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <BottomSheetView
      style={{
        flex: 1,
        paddingBottom: Spacings.md,
      }}
    >
      {children}
    </BottomSheetView>
  );
}
