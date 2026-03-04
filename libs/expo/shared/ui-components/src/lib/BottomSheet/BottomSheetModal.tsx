/**
 * Design-system wrapper around @gorhom/bottom-sheet BottomSheetModal.
 *
 * Intended to be used with the app-level BottomSheetModalProvider,
 * which manages presentation, stacking, and lifecycle via the
 * `showBottomSheet` API.
 *
 * Standardizes styling and behavior (dynamic sizing, backdrop,
 * optional close button) and supports static or scrollable content.
 *
 * Technically requires @gorhom/bottom-sheet's BottomSheetModalProvider
 * in the tree, which the app-level provider already includes.
 */

import {
  BottomSheetBackdropProps,
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetModal as GbsBottomSheetModal,
  BottomSheetModalProps as GbsBottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, forwardRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import CloseButton from '../CloseButton';
import { BottomSheetBackdrop } from './BottomSheetBackdrop';
import { BottomSheetOptions } from './types';

const DEFAULT_PADDING_HORIZONTAL = Spacings.md;

/**
 * Subset of public BottomSheet options that apply at
 * the wrapper component level (not provider-level).
 */
type WrapperLevelOptions = Pick<
  BottomSheetOptions,
  'disableBackdrop' | 'backdropOpacity' | 'scrollable'
>;

type BottomSheetModalOwnProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onRequestClose?: () => void;
  hideCloseButton?: boolean;
};

type TBottomSheetModal = GbsBottomSheetModalProps &
  WrapperLevelOptions &
  BottomSheetModalOwnProps;

export const BottomSheetModal = forwardRef<
  GbsBottomSheetModal,
  TBottomSheetModal
>(function BottomSheetModal(props, ref) {
  const {
    children,
    disableBackdrop,
    backdropOpacity,
    contentStyle,
    scrollable,
    style,
    enablePanDownToClose,
    enableDynamicSizing,
    handleComponent,
    handleIndicatorStyle,
    hideCloseButton,
    onRequestClose,
    ...rest
  } = props;

  function handleClose() {
    onRequestClose?.();
  }

  const ContentContainer = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <GbsBottomSheetModal
      ref={ref}
      enablePanDownToClose={enablePanDownToClose ?? false}
      enableDynamicSizing={enableDynamicSizing ?? true}
      handleComponent={handleComponent ?? null}
      handleIndicatorStyle={handleIndicatorStyle ?? { height: 0 }}
      backdropComponent={(backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          disableBackdrop={disableBackdrop}
          opacity={backdropOpacity}
        />
      )}
      {...rest}
      style={[styles.container, style]}
    >
      <ContentContainer>
        {!hideCloseButton && (
          <View style={[styles.topNav]}>
            <CloseButton
              style={{
                minWidth: 0,
                paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
              }}
              accessibilityHint="closes the bottom prompt modal"
              onClose={handleClose}
            />
          </View>
        )}
        {children}
      </ContentContainer>
    </GbsBottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    elevation: 12,
  },
  topNav: {
    paddingTop: Spacings.sm,
  },
});
