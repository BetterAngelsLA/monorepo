import { useClientProfilesQuery } from '../../screens/Clients/__generated__/Clients.generated';

export default function useCaliforniaIdValidation(
  californiaId: string,
  clientProfileId?: string
) {
  const { data } = useClientProfilesQuery({
    skip: !californiaId || californiaId.length !== 8,
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
