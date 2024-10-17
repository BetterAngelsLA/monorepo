import { Colors } from '@monorepo/expo/shared/static';
import { ReactElement } from 'react';
import {
  Snackbar as RnpSnackbar,
  SnackbarProps as RnpSnackbarProps,
} from 'react-native-paper';

export type TSnackbarType = 'default' | 'success' | 'error';

export interface ISnackbar extends RnpSnackbarProps {
  type?: TSnackbarType;
  onActionPress?: () => void;
  actionLabel?: string;
}

const typeStyles = {
  error: {
    backgroundColor: Colors.ERROR,
  },
  success: {
    backgroundColor: Colors.SUCCESS,
  },
  default: {
    backgroundColor: Colors.PRIMARY,
  },
};

export function Snackbar(props: ISnackbar): ReactElement {
  const { style, onActionPress, type, actionLabel = 'Close', ...rest } = props;

  return (
    <RnpSnackbar
      style={[style, typeStyles[type || 'default']]}
      action={{
        label: actionLabel,
        onPress: onActionPress,
      }}
      {...rest}
    />
  );
}
