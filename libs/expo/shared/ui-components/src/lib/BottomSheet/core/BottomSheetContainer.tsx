import { ReactNode } from 'react';
import { FullWindowOverlay } from 'react-native-screens';

type BottomSheetContainerProps = {
  children?: ReactNode;
};

export function BottomSheetContainer(props: BottomSheetContainerProps) {
  const { children } = props;

  return <FullWindowOverlay>{children}</FullWindowOverlay>;
}
