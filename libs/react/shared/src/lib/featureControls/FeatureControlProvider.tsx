import { ReactElement, ReactNode } from 'react';
import { FeatureControlContext } from './featureControlContext';
import { FeatureControlGroups } from './types';

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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
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
