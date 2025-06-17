import { ClientProfileQuery } from '../__generated__/Client.generated';
import { InteractionsMap } from './map/InteractionsMap';

type TProps = {
  client: ClientProfileQuery | undefined;
};

export function InteractionLocations(props: TProps) {
  const { client } = props;

  if (!client?.clientProfile.id) {
    throw new Error('Something went wrong. Please try again.');
  }

  return <InteractionsMap clientProfileId={client.clientProfile.id} />;
}
