import { atom } from 'jotai';
import { Region } from 'react-native-maps';
import { HmisNotesQuery } from '../../screens/ClientHMIS/tabs/ClientInteractionsHmisView/__generated__/ClientInteractionsHmisView.generated';

export type THmisClientInteractionsMapState = {
  clientProfileId?: string | null;
  region: Region | null;
  selectedInteractions: HmisNotesQuery['hmisNotes']['results'];
};

export const hmisNullState: THmisClientInteractionsMapState = {
  clientProfileId: undefined,
  region: null,
  selectedInteractions: [],
};

export const hmisClientInteractionsMapState =
  atom<THmisClientInteractionsMapState>(hmisNullState);
