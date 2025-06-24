import { createMapStateContext } from '@monorepo/expo/shared/ui-components';
import { TInteractionsMapState } from './types';

export const {
  Provider: InteractionsMapStateProvider,
  useMapState: useInteractionsMapState,
} = createMapStateContext<TInteractionsMapState>('InteractionsMapState');
