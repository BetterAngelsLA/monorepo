import { createContext } from 'react';
import { useGetFeatureControlsQuery } from './__generated__/featureControls.generated';
import { FeatureControlGroups } from './types';

export interface TFeatureControlContext extends FeatureControlGroups {
  clearFeatureFlags: () => void;
  refetchFeatureFlags: ReturnType<typeof useGetFeatureControlsQuery>['refetch'];
}

export const FeatureControlContext = createContext<
  TFeatureControlContext | undefined
>(undefined);
