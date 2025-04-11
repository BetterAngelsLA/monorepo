import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useGetFeatureControlsQuery } from './__generated__/featureControls.generated';
import { FeatureControlContext } from './featureControlContext';
import { nullFeatureControlGroup, toControlMap } from './toControlMap';
import { TFeatureControlGroup } from './types';

type TProps = {
  children: ReactNode;
};

export function FeatureControlProvider(props: TProps) {
  const { children } = props;

  const [featureControlGroup, setFeatureControlGroup] =
    useState<TFeatureControlGroup>(nullFeatureControlGroup);

  const { data, refetch } = useGetFeatureControlsQuery();

  const clearFeatureFlags = () => {
    setFeatureControlGroup(nullFeatureControlGroup);
  };

  useEffect(() => {
    if (!data?.featureControls) {
      clearFeatureFlags();

      return;
    }

    setFeatureControlGroup({
      flags: toControlMap(data.featureControls.flags),
      switches: toControlMap(data.featureControls.switches),
      samples: toControlMap(data.featureControls.samples),
    });
  }, [data]);

  const memoizedControlGroup = useMemo(
    () => featureControlGroup,
    [featureControlGroup]
  );

  return (
    <FeatureControlContext.Provider
      value={{
        ...memoizedControlGroup,
        refetchFeatureFlags: refetch,
        clearFeatureFlags,
      }}
    >
      {children}
    </FeatureControlContext.Provider>
  );
}
