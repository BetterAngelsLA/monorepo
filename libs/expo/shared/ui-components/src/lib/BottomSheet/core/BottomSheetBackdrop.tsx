/**
 * BottomSheetBackdrop
 *
 * Internal wrapper around Gorhom's backdrop component.
 *
 * Responsibilities:
 * - Conditionally render backdrop
 * - Apply opacity defaults
 * - Allow full override via custom component
 *
 * Behavior:
 * - `disableBackdrop` → no render
 * - `component`       → fully replaces default implementation
 *
 * This is a render-only primitive.
 *
 * Upstream:
 * - Configured via `BottomSheetOptions`
 * - Used by `BottomSheetBase`
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
