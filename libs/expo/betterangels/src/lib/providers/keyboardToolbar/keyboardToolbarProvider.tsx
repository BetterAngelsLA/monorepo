import { ReactNode, useEffect, useState } from 'react';
import {
  KeyboardEvents,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = { children: ReactNode };

export default function KeyboardToolbarProvider({ children }: Props) {
  const [_openSeq, setOpenSeq] = useState(0); // used to force remount
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const sub = KeyboardEvents.addListener('keyboardWillShow', () => {
      // iOS 18 + Fabric: the input accessory (toolbar) can be snapshotted on the first open
      // (observed on iPhone XS 18.5), causing the Done/Next/Prev buttons not to fire.
      // This bumps the key to force a fresh mount each time the keyboard opens.
      setOpenSeq((n) => n + 1);
    });

    return () => sub.remove();
  }, []);

  return (
    <>
      {children}

      <KeyboardToolbar insets={insets}>
        <KeyboardToolbar.Done />
      </KeyboardToolbar>
    </>
  );
}
