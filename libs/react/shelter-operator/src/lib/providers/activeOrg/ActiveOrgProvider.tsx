import { ACTIVE_ORG_STORAGE_KEY } from '@monorepo/apollo';
import { useActiveOrgState } from '@monorepo/react/shared';
import { TOrganization } from '@monorepo/react/shelter';
import { ReactNode, useMemo } from 'react';
import ActiveOrgContext from './ActiveOrgContext';

interface ActiveOrgProviderProps {
  children: ReactNode;
  organizations: TOrganization[];
}

export function ActiveOrgProvider({
  children,
  organizations,
}: ActiveOrgProviderProps) {
  const { activeOrg, setActiveOrgId } = useActiveOrgState({
    organizations,
    storageKey: ACTIVE_ORG_STORAGE_KEY,
  });

  const value = useMemo(
    () => ({ activeOrg, organizations, setActiveOrgId }),
    [activeOrg, organizations, setActiveOrgId]
  );

  return (
    <ActiveOrgContext.Provider value={value}>
      {children}
    </ActiveOrgContext.Provider>
  );
}
