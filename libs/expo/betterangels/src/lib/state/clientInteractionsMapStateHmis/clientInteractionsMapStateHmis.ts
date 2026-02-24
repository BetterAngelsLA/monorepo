import { atom } from 'jotai';
import { Region } from 'react-native-maps';
import { InteractionListHmisQuery } from '../../ui-components/InteractionListHmis/__generated__/interactionListHmis.generated';

export type TClientInteractionsMapStateHmis = {
  clientProfileId?: string | null;
  region: Region | null;
  selectedInteractions: InteractionListHmisQuery['hmisNotes']['results'];
};

export const nullStateHmis: TClientInteractionsMapStateHmis = {
  clientProfileId: undefined,
  region: null,
  selectedInteractions: [],
};

export const clientInteractionsMapStateHmis =
  atom<TClientInteractionsMapStateHmis>(nullStateHmis);
