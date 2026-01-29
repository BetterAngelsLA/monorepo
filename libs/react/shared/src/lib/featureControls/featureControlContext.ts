import { createContext, useContext } from 'react';
import type { QueryResult } from '@apollo/client/react';
import type { GetFeatureControlsQuery } from './__generated__/featureControlProvider.generated';

export type FeatureControlDictionary = {
  [key: string]: { isActive: boolean; lastModified?: string | null };
};

export interface FeatureControlGroups {
  flags: FeatureControlDictionary;
  switches: FeatureControlDictionary;
  samples: FeatureControlDictionary;
}

export interface TFeatureControlContext extends FeatureControlGroups {
  loading: boolean;
  error: Error | undefined;
  clearFeatureFlags: () => void;
  refetchFeatureFlags: QueryResult<GetFeatureControlsQuery>['refetch'];
}

export const FeatureControlContext = createContext<
  TFeatureControlContext | undefined
>(undefined);

export const useFeatureControls = (): TFeatureControlContext => {
  const context = useContext(FeatureControlContext);
  if (context === undefined) {
    throw new Error(
      'useFeatureControls must be used within a FeatureControlProvider'
    );
  }
  return context;
};
