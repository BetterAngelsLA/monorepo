import { useEffect } from 'react';

import { useLocation } from 'react-router';

export const useScrollTopOnLocationChange = (): void => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
};
