import { ReactNode } from 'react';
import { AuthProvider as SharedAuthProvider } from '@monorepo/react/shared';
import { useUser } from '../../hooks';
import { routeAccess } from './routeAccess';

export default function AuthProvider({ children }: { children: ReactNode }) {
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
