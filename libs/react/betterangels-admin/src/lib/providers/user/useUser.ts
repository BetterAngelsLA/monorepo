import { useContext } from 'react';
import UserContext, { IUserProviderValue } from './UserContext';

export function useUser(): IUserProviderValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}
