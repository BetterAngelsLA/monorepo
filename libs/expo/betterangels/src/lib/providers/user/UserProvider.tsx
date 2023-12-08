import { ReactNode, useEffect, useState } from 'react';

import { useQuery } from '@apollo/client';
import { GET_CURRENT_USER } from '../../apollo/graphql';
import UserContext, { TUser } from './UserContext';

interface UserProviderProps {
  children: ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();
  const { data, loading: isLoading } = useQuery(GET_CURRENT_USER);

  useEffect(() => {
    if (data && !isLoading) {
      setUser(data.currentUser);
    }
  }, [data, isLoading]);

  const value = { user, setUser, isLoading };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
