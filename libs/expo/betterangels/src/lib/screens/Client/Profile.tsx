import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { ClientProfileQuery } from './__generated__/Client.generated';

export default function Profile({
  client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  return <TextRegular>Profile</TextRegular>;
}
