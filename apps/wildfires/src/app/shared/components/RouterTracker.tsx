import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "../utils/analytics";

const RouteTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);

  return null;
};

export default RouteTracker;
