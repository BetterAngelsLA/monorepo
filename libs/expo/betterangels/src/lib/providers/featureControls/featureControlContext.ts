import { createContext } from 'react';
import { useGetFeatureControlsQuery } from './__generated__/featureControls.generated';
import { TFeatureControlGroup } from './types';

export const BYE = 'bye';

export interface TFeatureControlContext extends TFeatureControlGroup {
  clearFeatureFlags: () => void;
  refetchFeatureFlags: ReturnType<typeof useGetFeatureControlsQuery>['refetch'];
}

export const FeatureControlContext = createContext<
  TFeatureControlContext | undefined
>(undefined);
