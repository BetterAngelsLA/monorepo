import { useEffect, useMemo, useState } from 'react';
import { useGetFeatureControlsQuery } from './__generated__/featureControls.generated';
import { FeatureControlContext } from './featureControlContext';
import { FeatureControlDictionary, FeatureControlGroups } from './interfaces';

interface FeatureControlProviderProps {
  children: React.ReactNode;
}

const toDictionary = (
  items: Array<{
    isActive?: boolean | null;
    lastModified?: string | null;
    name: string;
  }>
): FeatureControlDictionary =>
  items.reduce((acc, item) => {
    acc[item.name] = {
      isActive: item.isActive ?? false,
      lastModified: item.lastModified ?? null,
    };
    return acc;
  }, {} as FeatureControlDictionary);

export const FeatureControlProvider: React.FC<FeatureControlProviderProps> = ({
  children,
}) => {
  const [featureControlGroups, setFeatureControlGroups] =
    useState<FeatureControlGroups>({
      flags: {},
      switches: {},
      samples: {},
    });

  const { data, error } = useGetFeatureControlsQuery();

  useEffect(() => {
    if (data?.featureControls) {
      setFeatureControlGroups({
        flags: toDictionary(data.featureControls.flags),
        switches: toDictionary(data.featureControls.switches),
        samples: toDictionary(data.featureControls.samples),
      });
    } else {
      /*
      Clears existing flags if data is null. Consider retaining the last known state to
      avoid frequent toggling between default and active flags, especially during connectivity
      issues, to prevent flickering. This will be important when we integrate incremental refresh later.
      */

      setFeatureControlGroups({
        flags: {},
        switches: {},
        samples: {},
      });
    }
  }, [data]);

  const memoizedControlGroups = useMemo(
    () => featureControlGroups,
    [featureControlGroups]
  );

  return (
    <FeatureControlContext.Provider value={memoizedControlGroups}>
      {children}
    </FeatureControlContext.Provider>
  );
};
