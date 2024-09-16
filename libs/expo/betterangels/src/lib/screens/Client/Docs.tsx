import { TextRegular } from '@monorepo/expo/shared/ui-components';
import { ClientProfileQuery } from './__generated__/Client.generated';

export default function Docs({
  client,
}: {
  client: ClientProfileQuery | undefined;
}) {
  return <TextRegular>Docs</TextRegular>;
}
