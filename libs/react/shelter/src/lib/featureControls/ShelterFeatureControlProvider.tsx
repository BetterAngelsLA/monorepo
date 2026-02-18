import { useApolloClient, useQuery } from '@apollo/client/react';
import {
  FeatureControlProvider,
  toFeatureControlDictionary,
} from '@monorepo/react/shared';
import {
  GetShelterFeatureControlsDocument,
  GetShelterFeatureControlsQuery,
} from './__generated__/featureControls.generated';

export function ShelterFeatureControlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = useApolloClient();

  const { data, refetch, loading, error } =
    useQuery<GetShelterFeatureControlsQuery>(
      GetShelterFeatureControlsDocument,
      {
        fetchPolicy: 'network-only',
      }
    );

  const featureControls = data?.featureControls
    ? {
        flags: toFeatureControlDictionary(data.featureControls.flags),
        switches: toFeatureControlDictionary(data.featureControls.switches),
        samples: toFeatureControlDictionary(data.featureControls.samples),
      }
    : { flags: {}, switches: {}, samples: {} };

  function clearFeatureFlags() {
    client.cache.evict({ fieldName: 'featureControls' });
    client.cache.gc();
  }

  return (
    <FeatureControlProvider
      featureControls={featureControls}
      loading={loading}
      error={error}
      refetchFeatureFlags={refetch}
      clearFeatureFlags={clearFeatureFlags}
    >
      {children}
    </FeatureControlProvider>
  );
}
