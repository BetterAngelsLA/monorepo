import { useContext } from 'react';
import ActiveOrgContext, { IActiveOrgContextValue } from './ActiveOrgContext';

export function useActiveOrg(): IActiveOrgContextValue {
  const context = useContext(ActiveOrgContext);
  if (!context) {
    throw new Error('useActiveOrg must be used within an ActiveOrgProvider');
  }
  return context;
}
