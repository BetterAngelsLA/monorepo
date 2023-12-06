import { ReactNode, useState } from 'react';

import UserContext, { TUser } from './UserContext';

interface UserProviderProps {
  children: ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<TUser | undefined>();

  const value = { user, setUser };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
