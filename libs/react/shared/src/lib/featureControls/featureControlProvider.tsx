import { ReactElement, ReactNode } from 'react';
import { FeatureControlGroups } from './types';
import { FeatureControlContext } from './featureControlContext';

interface FeatureControlProviderProps {
  children: ReactNode;
  featureControls: FeatureControlGroups;
  loading: boolean;
  error?: Error;
  refetchFeatureFlags: () => Promise<unknown>;
  clearFeatureFlags?: () => void;
}

export function FeatureControlProvider({
  children,
  featureControls,
  loading,
  error,
  refetchFeatureFlags,
  clearFeatureFlags = () => {},
}: FeatureControlProviderProps): ReactElement {
  return (
    <FeatureControlContext.Provider
      value={{
        ...featureControls,
        loading,
        error,
        refetchFeatureFlags,
        clearFeatureFlags,
      }}
    >
      {children}
    </FeatureControlContext.Provider>
  );
}
