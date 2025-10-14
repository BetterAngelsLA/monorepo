import { ReactNode, useState } from 'react';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardToolbarContext } from './keyboardToolbarContext';

type Props = { children: ReactNode };

export default function KeyboardToolbarProvider({ children }: Props) {
  const [keyboardArrowsVisible, setKeyboardArrowsVisible] = useState(false);
  const showKeyboardArrows = () => setKeyboardArrowsVisible(true);
  const hideKeyboardArrows = () => setKeyboardArrowsVisible(false);
  const insets = useSafeAreaInsets();

  return (
    <KeyboardToolbarContext.Provider
      value={{
        keyboardArrowsVisible,
        showKeyboardArrows,
        hideKeyboardArrows,
      }}
    >
      {children}

      <KeyboardToolbar insets={insets}>
        {/* Optional: custom background */}
        {/* <KeyboardToolbar.Background>…</KeyboardToolbar.Background> */}

        {/* Optional: center content */}
        {/* <KeyboardToolbar.Content>…</KeyboardToolbar.Content> */}

        {keyboardArrowsVisible && (
          <>
            <KeyboardToolbar.Prev
              onPress={() => {
                /* your logic */
              }}
            />
            <KeyboardToolbar.Next
              onPress={() => {
                /* your logic */
              }}
            />
          </>
        )}

        <KeyboardToolbar.Done
          onPress={() => {
            // default behavior: dismiss keyboard
            // or you can call your custom hideKeyboardArrows etc.
          }}
        />
      </KeyboardToolbar>
    </KeyboardToolbarContext.Provider>
  );
}
