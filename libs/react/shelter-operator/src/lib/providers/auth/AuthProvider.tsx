import { ReactNode } from 'react';
import { AuthProvider as SharedAuthProvider } from '@monorepo/react/shared';
import { routeAccess } from './routeAccess';

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SharedAuthProvider
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
