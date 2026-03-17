/**
 * BottomSheetBackdrop
 *
 * Wrapper around Gorhom's BottomSheetBackdrop.
 *
 * Responsibilities:
 * - Allows backdrop disabling
 * - Allows opacity customization
 * - Allows full custom backdrop override
 *
 * If a custom component is provided, it completely replaces
 * the default Gorhom backdrop behavior.
 *
 * This component is purely render-level and does not manage
 * lifecycle or stacking.
 */

import {
  BottomSheetBackdropProps,
  BottomSheetBackdrop as GorhomBackdrop,
} from '@gorhom/bottom-sheet';
import { ComponentType, ReactElement } from 'react';

type BottomSheetBackdropWrapperProps = BottomSheetBackdropProps & {
  /**
   * If true, no backdrop is rendered.
   */
  disableBackdrop?: boolean;

  /**
   * Backdrop opacity (default: 0.5).
   */
  opacity?: number;

  /**
   * Optional custom backdrop component.
   * If provided, it fully replaces the default implementation.
   */
  component?: ComponentType<BottomSheetBackdropProps>;
};

export function BottomSheetBackdrop(
  props: BottomSheetBackdropWrapperProps
): ReactElement | null {
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
