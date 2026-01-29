import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useEffect, useMemo, useState } from 'react';
import { FeatureControlContext } from './featureControlContext';
import {
  FeatureControlDictionary,
  FeatureControlGroups,
  FeatureControlsQuery,
  FeatureControlItem,
} from './interfaces';

const GET_FEATURE_CONTROLS = gql`
  query GetFeatureControls {
    featureControls {
      flags {
        name
        isActive
        lastModified
      }
      switches {
        name
        isActive
        lastModified
      }
      samples {
        name
        isActive
        lastModified
      }
    }
  }
`;

interface FeatureControlProviderProps {
  children: React.ReactNode;
}

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

  const { data, refetch } = useQuery<FeatureControlsQuery>(
    GET_FEATURE_CONTROLS,
    {
      fetchPolicy: 'network-only',
    }
  );

  const clearFeatureFlags = () => {
    setFeatureControlGroups({
      flags: {},
      switches: {},
      samples: {},
    });
  };

  useEffect(() => {
    if (data?.featureControls) {
      setFeatureControlGroups({
        flags: toDictionary(data.featureControls.flags),
        switches: toDictionary(data.featureControls.switches),
        samples: toDictionary(data.featureControls.samples),
      });
    } else {
      clearFeatureFlags();
    }
  }, [data]);

  const memoizedControlGroups = useMemo(
    () => featureControlGroups,
    [featureControlGroups]
  );

  return (
    <FeatureControlContext.Provider
      value={{
        ...memoizedControlGroups,
        refetchFeatureFlags: refetch,
        clearFeatureFlags,
      }}
    >
      {children}
    </FeatureControlContext.Provider>
  );
};
