import { atom } from 'jotai';
import { Region } from 'react-native-maps';
import { HmisNoteType } from '../../apollo';

export type THmisClientInteractionsMapState = {
  clientProfileId?: string | null;
  region: Region | null;
  selectedInteractions: HmisNoteType[];
};

export const hmisNullState: THmisClientInteractionsMapState = {
  clientProfileId: undefined,
  region: null,
  selectedInteractions: [],
};

export const hmisClientInteractionsMapState =
  atom<THmisClientInteractionsMapState>(hmisNullState);
