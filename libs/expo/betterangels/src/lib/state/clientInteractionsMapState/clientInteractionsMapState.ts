import { atom } from 'jotai';
import { Region } from 'react-native-maps';
import { TNotesQueryInteraction } from '../../apollo';

export type TClientInteractionsMapState = {
  clientProfileId?: string | null;
  region: Region | null;
  selectedInteractions: TNotesQueryInteraction[];
};

export const nullState: TClientInteractionsMapState = {
  clientProfileId: undefined,
  region: null,
  selectedInteractions: [],
};

export const clientInteractionsMapState =
  atom<TClientInteractionsMapState>(nullState);
