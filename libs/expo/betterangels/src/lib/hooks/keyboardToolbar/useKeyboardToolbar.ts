import { useContext } from 'react';

import {
  KeyboardToolbarContext,
  type TKeyboardToolbarContext,
} from '../../providers/keyboardToolbar/keyboardToolbarContext';

export default function useKeyboardToolbar(): TKeyboardToolbarContext {
  const context = useContext(KeyboardToolbarContext);

  if (!context) {
    throw new Error('keyboardToolbarContext missing');
  }

  return context;
}
