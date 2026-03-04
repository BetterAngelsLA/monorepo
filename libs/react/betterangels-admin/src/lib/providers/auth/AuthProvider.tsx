import { AuthProvider as SharedAuthProvider } from '@monorepo/react/shared';
import { ReactNode } from 'react';
import { useUser } from '../user';
import { routeAccess } from './routeAccess';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();

  return (
    <SharedAuthProvider
      user={user}
      isLoading={isLoading}
      config={{
        routeAccess,
        signInRoute: '/sign-in',
        defaultAuthenticatedRoute: '/users',
      }}
    >
      {children}
    </SharedAuthProvider>
  );
}
