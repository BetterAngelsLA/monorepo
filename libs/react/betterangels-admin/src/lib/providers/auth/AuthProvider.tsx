import { ReactNode } from 'react';
import { AuthProvider as SharedAuthProvider } from '@monorepo/react/shared';
import { routeAccess } from './routeAccess';

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SharedAuthProvider
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
