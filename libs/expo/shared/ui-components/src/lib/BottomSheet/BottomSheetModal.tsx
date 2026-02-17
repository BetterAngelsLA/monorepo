import {
  BottomSheetBackdropProps,
  BottomSheetView,
  BottomSheetModal as GbsBottomSheetModal,
  BottomSheetModalProps as GbsBottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { Spacings } from '@monorepo/expo/shared/static';
import { ReactNode, forwardRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import CloseButton from '../CloseButton';
import { BottomSheetBackdrop } from './BottomSheetBackdrop';

const DEFAULT_PADDING_HORIZONTAL = Spacings.md;

type BackdropOptions = {
  disableBackdrop?: boolean;
  backdropOpacity?: number;
};

type TBottomSheetModal = GbsBottomSheetModalProps &
  BackdropOptions & {
    children: ReactNode;
    contentStyle?: StyleProp<ViewStyle>;
    onRequestClose?: () => void;
    hideCloseButton?: boolean;
  };

export const BottomSheetModal = forwardRef<
  GbsBottomSheetModal,
  TBottomSheetModal
>(function BottomSheetModal(props, ref) {
  const {
    children,
    disableBackdrop,
    backdropOpacity,
    contentStyle,
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
      <BottomSheetView>
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
      </BottomSheetView>
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
