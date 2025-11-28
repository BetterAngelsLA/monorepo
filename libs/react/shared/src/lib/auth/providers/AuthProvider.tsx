import { ReactNode, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks';

export interface AuthProviderConfig {
  /** Route access configuration mapping paths to access types */
  routeAccess: Record<string, 'safe' | 'unsafe' | 'neutral'>;
  /** Path to redirect to when user is not authenticated */
  signInRoute: string;
  /** Default path to redirect to after successful authentication */
  defaultAuthenticatedRoute: string;
}

export interface AuthProviderProps {
  children: ReactNode;
  /** Configuration for routes and redirects */
  config: AuthProviderConfig;
}

type AccessType = 'safe' | 'unsafe' | 'neutral';

function getRouteAccess(
  pathname: string,
  routeAccess: Record<string, AccessType>
): AccessType {
  const sortedRoutes = Object.keys(routeAccess).sort(
    (a, b) => b.length - a.length
  );
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      return routeAccess[route];
    }
  }

  return 'neutral';
}

export default function AuthProvider({
  children,
  config,
}: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    const access = getRouteAccess(location.pathname, config.routeAccess);

    if (access === 'safe' && !user) {
      hasRedirected.current = true;
      navigate(config.signInRoute, {
        state: { from: location.pathname },
        replace: true,
      });
    }

    if (access === 'unsafe' && user) {
      const from =
        (location.state as any)?.from || config.defaultAuthenticatedRoute;
      hasRedirected.current = true;
      navigate(from, { replace: true });
    }
  }, [
    user,
    isLoading,
    location.pathname,
    location.state,
    navigate,
    config.signInRoute,
    config.defaultAuthenticatedRoute,
    config.routeAccess,
  ]);

  if (isLoading) {
    return null;
  }

  const access = getRouteAccess(location.pathname, config.routeAccess);

  if (access === 'safe' && !user) {
    return null;
  }

  if (access === 'unsafe' && user) {
    return null;
  }

  return <>{children}</>;
}
