import { Dispatch, SetStateAction } from 'react';
import { Region } from 'react-native-maps';
import { TNotesQueryInteraction } from '../../../../../apollo';

export type TInteractionsMapState = {
  region: Region | null;
  selectedInteractions: TNotesQueryInteraction[];
};

export type TInteractionsMapStateContext = {
  mapState: TInteractionsMapState;
  setMapState: Dispatch<SetStateAction<TInteractionsMapState>>;
  resetMapState: () => void;
};
