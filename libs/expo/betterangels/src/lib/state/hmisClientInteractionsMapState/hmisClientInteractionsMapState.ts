import { atom } from 'jotai';
import { Region } from 'react-native-maps';
import { InteractionListHmisQuery } from '../../ui-components/InteractionListHmis/__generated__/interactionListHmis.generated';

export type THmisClientInteractionsMapState = {
  clientProfileId?: string | null;
  region: Region | null;
  selectedInteractions: InteractionListHmisQuery['hmisNotes']['results'];
};

export const hmisNullState: THmisClientInteractionsMapState = {
  clientProfileId: undefined,
  region: null,
  selectedInteractions: [],
};

export const hmisClientInteractionsMapState =
  atom<THmisClientInteractionsMapState>(hmisNullState);
