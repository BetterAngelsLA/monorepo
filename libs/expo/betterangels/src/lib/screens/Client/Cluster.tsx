import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { ClientProfileQuery } from './__generated__/Client.generated';

export default function Cluster({
  client: _client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  return <TextRegular>Cluster</TextRegular>;
}
