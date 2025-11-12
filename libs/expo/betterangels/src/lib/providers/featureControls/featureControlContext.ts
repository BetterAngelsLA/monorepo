import { ApolloClient } from '@apollo/client';
import { createContext, useContext } from 'react';
import {
  GetFeatureControlsQuery,
  GetFeatureControlsQueryVariables,
} from './__generated__/featureControls.generated';
import { FeatureControlGroups } from './interfaces';

export interface TFeatureControlContext extends FeatureControlGroups {
  clearFeatureFlags: () => void;
  refetchFeatureFlags: (
    variables?: Partial<GetFeatureControlsQueryVariables>
  ) => Promise<ApolloClient.QueryResult<GetFeatureControlsQuery>>;
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
