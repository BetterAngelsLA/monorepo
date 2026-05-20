export const routeAccess = {
  '/operator/onboarding': 'safe',
  '/operator': 'safe',
  '/operator/sign-in': 'unsafe',
  '/operator/sign-up': 'unsafe',
} as const;
