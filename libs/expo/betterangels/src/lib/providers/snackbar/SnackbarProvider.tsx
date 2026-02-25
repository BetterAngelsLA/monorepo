import {
  Snackbar,
  type TSnackbarType,
} from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode, useState } from 'react';
import { SnackbarContext } from './SnackbarContext';

type TShowSnackbarBase = {
  message: string;
  type?: TSnackbarType;
};

// requires manual close
type TPersisted = TShowSnackbarBase & {
  persist: true;
  durationMs?: never;
};

// auto closes
type TAutoClose = TShowSnackbarBase & {
  durationMs?: number;
  persist?: never;
};

export type TShowSnackbar = TPersisted | TAutoClose;

type TSnackbarProvider = {
  children: ReactNode;
};

export default function SnackbarProvider(
  props: TSnackbarProvider
): ReactElement {
  const { children } = props;

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [snackbarType, setSnackbarType] = useState<TSnackbarType | undefined>(
    undefined
  );

  const showSnackbar = (props: TShowSnackbar) => {
    const { message, type } = props;

    const visibleDuration =
      'persist' in props ? Number.POSITIVE_INFINITY : props.durationMs;

    setVisible(true);
    setMessage(message);
    setDuration(visibleDuration);
    setSnackbarType(type);
  };

  const dismissSnackbar = () => {
    setVisible(false);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      <Snackbar
        visible={visible}
        type={snackbarType}
        duration={duration}
        onDismiss={dismissSnackbar}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
