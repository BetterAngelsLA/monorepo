import {
  Snackbar,
  type TSnackbar,
  type TSnackbarType,
} from '@monorepo/expo/shared/ui-components';
import { ReactElement, ReactNode, useState } from 'react';
import { SnackbarContext } from './SnackbarContext';

export type TShowSnackbar = Pick<
  TSnackbar,
  'message' | 'type' | 'showDuration'
>;

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
    const { message, showDuration, type } = props;

    setVisible(true);
    setMessage(message);
    setDuration(showDuration);
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
        message={message}
        showDuration={duration}
        onDismiss={dismissSnackbar}
      />
    </SnackbarContext.Provider>
  );
}
