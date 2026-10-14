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

  /**
   * App-level dismiss request (dismissSheetById → modal dismiss/forceClose).
   * A tap routes through here as the single dismissal path.
   */
  onRequestClose?: () => void;
};

export function BottomSheetBackdrop(
  props: BottomSheetBackdropWrapperProps,
): ReactElement | null {
  const {
    disableBackdrop,
    opacity = 0.5,
    component: CustomComponent,
    onRequestClose,
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
      // Gorhom only attaches the backdrop tap when pressBehavior !== 'none',
      // and it invokes onPress BEFORE applying the behavior. We want the tap
      // (so onPress can route dismissal through onRequestClose) but must NOT
      // let Gorhom close/collapse — that would double-dismiss alongside the
      // provider's dismiss. numeric 0 → snapToIndex(0), a no-op for every
      // sheet here because they all present at index 0 (dynamic sizing, or a
      // single '100%' snap point).
      //
      // CONSTRAINT: a future multi-snap sheet that presents at index > 0 would
      // visibly snap to index 0 on tap. If that's ever needed, revisit this.
      pressBehavior={0}
      onPress={onRequestClose}
    />
  );
}
