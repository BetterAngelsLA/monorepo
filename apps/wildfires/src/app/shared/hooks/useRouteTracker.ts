import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { trackPageview } from '../utils/analytics';

export const useRouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);
};
