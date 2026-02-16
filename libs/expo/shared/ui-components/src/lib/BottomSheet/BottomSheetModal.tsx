import {
  BottomSheetBackdropProps,
  BottomSheetModal as GbsBottomSheetModal,
  BottomSheetModalProps as GbsBottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { ReactNode, forwardRef } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BottomSheetBackdrop } from './BottomSheetBackdrop';

type BackdropOptions = {
  disableBackdrop?: boolean;
  backdropOpacity?: number;
};

type TBottomSheetModal = GbsBottomSheetModalProps &
  BackdropOptions & {
    children: ReactNode;
    contentStyle?: StyleProp<ViewStyle>;
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
    ...rest
  } = props;
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
      {children}
    </GbsBottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    elevation: 12,
    borderWidth: 1,
    borderColor: 'yellow',
    backgroundColor: 'red',
    // borderTopLeftRadius: 16,
    // borderTopRightRadius: 16,
    // borderTopEndRadius: 88,
    // borderTopRightRadius: 88,
    // borderTopLeftRadius: 88,
    // overflow: 'hidden',
  },
});
