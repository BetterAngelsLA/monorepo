import {
  Client,
  ClientHmis,
  ClientProfileSectionEnum,
  isValidClientProfileSectionEnum,
  useResetClientInteractionsMapState,
  useResetClientInteractionsMapStateHmis,
  useUser,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

type TSearchParams = {
  id: string;
  arrivedFrom?: string;
  openCard?: string;
};

export default function ClientScreen() {
  const { id, arrivedFrom, openCard } = useLocalSearchParams<TSearchParams>();

  const { isHmisUser } = useUser();

  const updateInteractionsMapState = useResetClientInteractionsMapState();
  const updateInteractionsMapStateHmis =
    useResetClientInteractionsMapStateHmis();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  let openCardName: ClientProfileSectionEnum | undefined = undefined;

  if (isValidClientProfileSectionEnum(openCard)) {
    openCardName = openCard as ClientProfileSectionEnum;
  }

  if (isHmisUser) {
    updateInteractionsMapStateHmis(id);
    return (
      <ClientHmis id={id} arrivedFrom={arrivedFrom} openCard={openCardName} />
    );
  }

  updateInteractionsMapState(id);

  return <Client id={id} arrivedFrom={arrivedFrom} openCard={openCardName} />;
}
