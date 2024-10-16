import { ReactNode, useState } from 'react';
import { KeyboardToolbar } from 'react-native-keyboard-controller';

import { KeyboardToolbarContext } from './keyboardToolbarContext';

type TKeyboardToolbarProvider = {
  children: ReactNode;
};

export default function KeyboardToolbarProvider(
  props: TKeyboardToolbarProvider
) {
  const { children } = props;

  const [keyboardArrowsVisible, setKeyboardArrowsVisible] = useState(true);

  const showKeyboardArrows = () => setKeyboardArrowsVisible(true);
  const hideKeyboardArrows = () => setKeyboardArrowsVisible(false);

  return (
    <KeyboardToolbarContext.Provider
      value={{
        keyboardArrowsVisible,
        showKeyboardArrows,
        hideKeyboardArrows,
      }}
    >
      {children}

      <KeyboardToolbar showArrows={keyboardArrowsVisible} />
    </KeyboardToolbarContext.Provider>
  );
}
