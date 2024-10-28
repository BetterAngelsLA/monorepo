import { useContext } from 'react';
import {
  SnackbarContext,
  type TSnackbarContext,
} from '../../providers/snackbar/SnackbarContext';

export default function useSnackbar(): TSnackbarContext {
  const snackbarContext = useContext(SnackbarContext);

  if (!snackbarContext) {
    throw new Error('snackbarContext missing');
  }

  return snackbarContext;
}
