import { AuthProvider as SharedAuthProvider } from '@monorepo/react/shared';
import { useUser } from '@monorepo/react/shelter';
import { ReactNode } from 'react';
import { routeAccess } from './routeAccess';

export function OperatorAuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();

  return (
    <SharedAuthProvider
      user={user}
      isLoading={isLoading}
      config={{
        routeAccess,
        signInRoute: '/operator/sign-in',
        defaultAuthenticatedRoute: '/operator',
      }}
    >
      {children}
    </SharedAuthProvider>
  );
}
