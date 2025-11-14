import { ReactNode, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks';
import { getRouteAccess } from './routeAccess';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return;

    const access = getRouteAccess(location.pathname);

    if (access === 'safe' && !user) {
      hasRedirected.current = true;
      navigate('/operator/sign-in', {
        state: { from: location.pathname },
        replace: true,
      });
    }

    if (access === 'unsafe' && user) {
      const from = (location.state as any)?.from || '/operator';
      hasRedirected.current = true;
      navigate(from, { replace: true });
    }
  }, [user, isLoading, location.pathname, location.state, navigate]);

  if (isLoading) {
    return null;
  }

  const access = getRouteAccess(location.pathname);

  if (access === 'safe' && !user) {
    return null;
  }

  if (access === 'unsafe' && user) {
    return null;
  }

  return <>{children}</>;
}
