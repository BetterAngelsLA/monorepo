import {
  Client,
  ClientProfileSectionEnum,
  isValidClientProfileSectionEnum,
  useResetClientInteractionsMapState,
} from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';

type TSearchParams = {
  id: string;
  arrivedFrom?: string;
  openCard?: string;
};

export default function ClientScreen() {
  const { id, arrivedFrom, openCard } = useLocalSearchParams<TSearchParams>();

  const updateInteractionsMapState = useResetClientInteractionsMapState();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  let openCardName: ClientProfileSectionEnum | undefined = undefined;

  if (isValidClientProfileSectionEnum(openCard)) {
    openCardName = openCard as ClientProfileSectionEnum;
  }

  updateInteractionsMapState(id);

  return <Client id={id} arrivedFrom={arrivedFrom} openCard={openCardName} />;
}
