import { Client } from '@monorepo/expo/betterangels';
import { useLocalSearchParams } from 'expo-router';
import {
  ClientProfileCardEnum,
  isValidClientProfileCardEnum,
} from 'libs/expo/betterangels/src/lib/screens/Client/ClientProfile_V2/constants';

type TSerachParams = {
  id: string;
  arrivedFrom?: string;
  openCard?: string;
};

export default function ClientScreen() {
  const { id, arrivedFrom, openCard } = useLocalSearchParams<TSerachParams>();

  if (!id) {
    throw new Error('Something went wrong. Please try again.');
  }

  let openCardName: ClientProfileCardEnum | undefined = undefined;

  if (isValidClientProfileCardEnum(openCard)) {
    openCardName = openCard as ClientProfileCardEnum;
  }

  return <Client id={id} arrivedFrom={arrivedFrom} openCard={openCardName} />;
}
