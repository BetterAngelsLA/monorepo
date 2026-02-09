import { Colors } from '@monorepo/expo/shared/static';
import { ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import KeyboardAwareScrollView from '../KeyboardAwareScrollView';
import LoadingView from '../LoadingView';
import { FormButtons, TFormButtons } from './FormButtons';

type TProps = {
  style?: ViewStyle;
  children: ReactNode;
  actionProps?: TFormButtons;
  scrollViewRef?: RefObject<ScrollView | null>;
  showLoadingOverlay?: boolean;
  loadingOverlayContent?: ReactNode;
};

export function FormPage(props: TProps) {
  const {
    actionProps,
    style,
    scrollViewRef,
    showLoadingOverlay,
    loadingOverlayContent,
    children,
  } = props;

  const overlayContent = loadingOverlayContent ?? (
    <LoadingView style={{ backgroundColor: 'transparent' }} />
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <KeyboardAwareScrollView ref={scrollViewRef}>
          {children}
        </KeyboardAwareScrollView>

        {showLoadingOverlay && (
          <View style={styles.overlay}>{overlayContent}</View>
        )}
      </View>

      {!!actionProps && <FormButtons {...actionProps} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
  },
  content: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
