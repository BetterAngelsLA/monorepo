import { useQuery } from '@apollo/client/react';
import { Regex } from '@monorepo/expo/shared/static';
import { ClientCaliforniaUniqueCheckDocument } from './__generated__/ClientCaliforniaUniqueCheck.generated';

export default function useCaliforniaIdUniqueCheck(
  californiaId: string,
  clientProfileId?: string
) {
  const { data } = useQuery(ClientCaliforniaUniqueCheckDocument, {
    skip: !Regex.californiaId.test(californiaId),
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

  return data?.clientProfiles?.results?.length
    ? 'This is the same CA ID as another client'
    : undefined;
}
