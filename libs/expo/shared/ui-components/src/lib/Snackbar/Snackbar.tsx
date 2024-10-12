import { Colors } from '@monorepo/expo/shared/static';
import { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Snackbar as RnpSnackbar } from 'react-native-paper';

export type TSnackbarType = 'default' | 'success' | 'error';

export type TSnackbar = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  type?: TSnackbarType;
  showDuration?: number;
  onActionPress?: () => void;
  styles?: StyleProp<ViewStyle>;
  actionLabel?: string;
};

export function Snackbar(props: TSnackbar): ReactElement {
  const {
    styles,
    message,
    showDuration,
    onDismiss,
    onActionPress,
    visible,
    type,
    actionLabel = 'Close',
  } = props;

  return (
    <RnpSnackbar
      style={[styles, getTypeStyles(type)]}
      visible={visible}
      duration={showDuration}
      onDismiss={onDismiss}
      action={{
        label: actionLabel,
        onPress: onActionPress,
      }}
    >
      {message}
    </RnpSnackbar>
  );
}

function getTypeStyles(type?: TSnackbarType): StyleProp<ViewStyle> {
  if (type === 'error') {
    return {
      backgroundColor: Colors.ERROR,
    };
  }

  if (type === 'success') {
    return {
      backgroundColor: Colors.SUCCESS,
    };
  }

  return {
    backgroundColor: Colors.PRIMARY,
  };
}
