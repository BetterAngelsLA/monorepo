import ReactGA from "react-ga4";

export const initGA = (): void => {
  const isAnalyticsEnabled = import.meta.env.VITE_ANALYTICS_ENABLED === "true";
  const analyticsID = import.meta.env.VITE_ANALYTICS_ID;

  if (isAnalyticsEnabled && analyticsID) {
    ReactGA.initialize(analyticsID);
    console.log(`Google Analytics initialized with ID: ${analyticsID}`);
  } else {
    console.warn("Google Analytics is disabled or missing configuration.");
  }
};

export const trackPageview = (path: string): void => {
  const isAnalyticsEnabled = import.meta.env.VITE_ANALYTICS_ENABLED === "true";

  if (isAnalyticsEnabled) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
};

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

export const trackEvent = ({ category, action, label, value }: AnalyticsEvent): void => {
  const isAnalyticsEnabled = import.meta.env.VITE_ANALYTICS_ENABLED === "true";

  if (isAnalyticsEnabled) {
    ReactGA.event({ category, action, label, value });
  }
};
