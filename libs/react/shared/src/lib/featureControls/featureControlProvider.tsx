import { useQuery, useApolloClient } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import {
  FeatureControlContext,
  FeatureControlDictionary,
  FeatureControlGroups,
} from './featureControlContext';
import {
  GetFeatureControlsDocument,
  GetFeatureControlsQuery,
} from './__generated__/featureControlProvider.generated';

interface FeatureControlProviderProps {
  children: React.ReactNode;
}

type FeatureControlItem = {
  name: string;
  isActive?: boolean | null;
  lastModified?: any | null;
};

const toDictionary = (items: FeatureControlItem[]): FeatureControlDictionary =>
  items.reduce((acc, item) => {
    acc[item.name] = {
      isActive: item.isActive ?? false,
      lastModified: item.lastModified ?? null,
    };
    return acc;
  }, {} as FeatureControlDictionary);

export const FeatureControlProvider = ({
  children,
}: FeatureControlProviderProps): React.ReactElement => {
  const [featureControlGroups, setFeatureControlGroups] =
    useState<FeatureControlGroups>({
      flags: {},
      switches: {},
      samples: {},
    });

  const client = useApolloClient();
  const { data, refetch, loading, error } = useQuery<GetFeatureControlsQuery>(
    GetFeatureControlsDocument,
    {
      fetchPolicy: 'network-only',
    }
  );

  const clearFeatureFlags = () => {
    client.cache.evict({ fieldName: 'featureControls' });
    client.cache.gc();
  };

  useEffect(() => {
    if (data?.featureControls) {
      setFeatureControlGroups({
        flags: toDictionary(data.featureControls.flags),
        switches: toDictionary(data.featureControls.switches),
        samples: toDictionary(data.featureControls.samples),
      });
    }
  }, [data]);

  return (
    <FeatureControlContext.Provider
      value={{
        ...featureControlGroups,
        loading,
        error,
        refetchFeatureFlags: refetch,
        clearFeatureFlags,
      }}
    >
      {children}
    </FeatureControlContext.Provider>
  );
};
