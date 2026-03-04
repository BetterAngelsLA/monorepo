import {
  BottomSheetBackdropProps,
  BottomSheetBackdrop as GorhomBackdrop,
} from '@gorhom/bottom-sheet';
import { ComponentType, ReactElement } from 'react';

type Props = BottomSheetBackdropProps & {
  disableBackdrop?: boolean;
  opacity?: number;
  component?: ComponentType<BottomSheetBackdropProps>;
};

export function BottomSheetBackdrop(props: Props): ReactElement | null {
  const {
    disableBackdrop,
    opacity = 0.5,
    component: CustomComponent,
    ...rest
  } = props;

  if (disableBackdrop) {
    return null;
  }

  if (CustomComponent) {
    return <CustomComponent {...rest} />;
  }

  return (
    <GorhomBackdrop
      {...rest}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={opacity}
      pressBehavior="close"
    />
  );
}
