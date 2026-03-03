import { Colors, FontSizes, Radiuses } from '@monorepo/expo/shared/static';
import { ReactElement } from 'react';
import {
  Snackbar as RnpSnackbar,
  SnackbarProps as RnpSnackbarProps,
} from 'react-native-paper';
import TextRegular from '../TextRegular';

export type TSnackbarType = 'default' | 'success' | 'error' | 'warning';

export interface ISnackbar extends RnpSnackbarProps {
  type?: TSnackbarType;
  onActionPress?: () => void;
  actionLabel?: string;
}

type TypeStyle = {
  container: object;
  textColor: string;
};

const VARIANTS: Record<TSnackbarType, TypeStyle> = {
  error: {
    container: {
      backgroundColor: Colors.ERROR_EXTRA_LIGHT,
      borderWidth: 1,
      borderColor: Colors.ERROR,
      borderRadius: Radiuses.xxs,
    },
    textColor: Colors.PRIMARY_EXTRA_DARK,
  },
  success: {
    container: {
      backgroundColor: Colors.SUCCESS_EXTRA_LIGHT,
      borderWidth: 1,
      borderColor: Colors.SUCCESS,
      borderRadius: Radiuses.xxs,
    },
    textColor: Colors.PRIMARY_EXTRA_DARK,
  },
  warning: {
    container: {
      backgroundColor: Colors.WARNING_EXTRA_LIGHT,
      borderWidth: 1,
      borderColor: Colors.WARNING,
      borderRadius: Radiuses.xxs,
    },
    textColor: Colors.PRIMARY_EXTRA_DARK,
  },
  default: {
    container: {
      backgroundColor: Colors.PRIMARY,
      borderWidth: 0,
    },
    textColor: Colors.PRIMARY_EXTRA_DARK,
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

  const variant = VARIANTS[type];

  return (
    <RnpSnackbar
      style={[variant.container, style]}
      contentStyle={contentStyle}
      action={{
        label: actionLabel,
        onPress: onActionPress,
        textColor: variant.textColor,
        labelStyle: {
          fontFamily: 'Poppins-SemiBold',
          fontWeight: '700',
          fontSize: FontSizes.sm.fontSize,
        },
      }}
      {...rest}
    >
      {typeof children === 'string' || typeof children === 'number' ? (
        <TextRegular size="sm" color={variant.textColor}>
          {children}
        </TextRegular>
      ) : (
        children
      )}
    </RnpSnackbar>
  );
}
