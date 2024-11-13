import { Regex } from '@monorepo/expo/shared/static';
import { useClientProfilesQuery } from '../../screens/Clients/__generated__/Clients.generated';

export default function useCaliforniaIdUniqueCheck(
  californiaId: string,
  clientProfileId?: string
) {
  const { data } = useClientProfilesQuery({
    skip: !californiaId || !Regex.californiaId.test(californiaId),
    variables: {
      filters: {
        searchClient: {
          excludedClientProfileId: clientProfileId || null,
          californiaId,
        },
      },
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });

  return data?.clientProfiles?.length
    ? 'This is the same CA ID as another client.'
    : undefined;
}
