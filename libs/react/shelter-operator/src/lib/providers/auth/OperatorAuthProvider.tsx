import { AuthProvider as SharedAuthProvider } from '@monorepo/react/shared';
import { operatorPath, useUser } from '@monorepo/react/shelter';
import { ReactNode } from 'react';
import { paths } from '../../routing';
import { routeAccess } from './routeAccess';

export function OperatorAuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();

  return (
    <SharedAuthProvider
      user={user}
      isLoading={isLoading}
      config={{
        routeAccess,
        signInRoute: paths.signIn,
        defaultAuthenticatedRoute: operatorPath,
      }}
    >
      {children}
    </SharedAuthProvider>
  );
}
