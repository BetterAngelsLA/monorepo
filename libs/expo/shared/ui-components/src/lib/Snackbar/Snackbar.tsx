import { Colors, FontSizes, Radiuses } from '@monorepo/expo/shared/static';
import { ReactElement } from 'react';
import {
  Snackbar as RnpSnackbar,
  SnackbarProps as RnpSnackbarProps,
} from 'react-native-paper';
import TextRegular from '../TextRegular';

export type TSnackbarType = 'default' | 'success' | 'error';

export interface ISnackbar extends RnpSnackbarProps {
  type?: TSnackbarType;
  onActionPress?: () => void;
  actionLabel?: string;
}

const typeStyles = {
  error: {
    container: {
      backgroundColor: Colors.ERROR_EXTRA_LIGHT,
      borderWidth: 1,
      borderColor: Colors.ERROR,
      borderRadius: Radiuses.xxs,
    },
    text: {
      color: Colors.PRIMARY_EXTRA_DARK,
    },
  },
  success: {
    container: {
      backgroundColor: Colors.SUCCESS_EXTRA_LIGHT,
      borderWidth: 1,
      borderColor: Colors.SUCCESS,
      borderRadius: Radiuses.xxs,
    },
    text: {
      color: Colors.PRIMARY_EXTRA_DARK,
    },
  },
  warning: {
    container: {
      backgroundColor: Colors.WARNING_EXTRA_LIGHT,
      borderWidth: 1,
      borderColor: Colors.WARNING,
      borderRadius: Radiuses.xxs,
    },
    text: {
      color: Colors.PRIMARY_EXTRA_DARK,
    },
  },
  default: {
    container: {
      backgroundColor: Colors.PRIMARY,
      borderWidth: 0,
    },
    text: {
      color: Colors.PRIMARY_EXTRA_DARK,
    },
  },
} as const;

export function Snackbar(props: ISnackbar): ReactElement {
  const {
    style,
    contentStyle,
    onActionPress,
    type = 'default',
    actionLabel = 'Close',
    children,
    ...rest
  } = props;

  const t = typeStyles[type];

  return (
    <RnpSnackbar
      style={[t.container, style]}
      contentStyle={contentStyle}
      action={{
        label: actionLabel,
        onPress: onActionPress,
        textColor: t.text.color,
        labelStyle: {
          fontFamily: 'Poppins-SemiBold',
          fontWeight: '700',
          fontSize: FontSizes.sm.fontSize,
        },
      }}
      {...rest}
    >
      <TextRegular size="sm" color={t.text.color}>
        {children}
      </TextRegular>
    </RnpSnackbar>
  );
}
