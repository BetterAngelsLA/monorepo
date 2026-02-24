import {
  Client,
  ClientHmis,
  ClientProfileSectionEnum,
  isValidClientProfileSectionEnum,
  useResetClientInteractionsMapState,
  useResetHmisClientInteractionsMapState,
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
  const updateHmisInteractionsMapState =
    useResetHmisClientInteractionsMapState();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  let openCardName: ClientProfileSectionEnum | undefined = undefined;

  if (isValidClientProfileSectionEnum(openCard)) {
    openCardName = openCard as ClientProfileSectionEnum;
  }

  if (isHmisUser) {
    updateHmisInteractionsMapState(id);
    return (
      <ClientHmis id={id} arrivedFrom={arrivedFrom} openCard={openCardName} />
    );
  }

  updateInteractionsMapState(id);

  return <Client id={id} arrivedFrom={arrivedFrom} openCard={openCardName} />;
}
