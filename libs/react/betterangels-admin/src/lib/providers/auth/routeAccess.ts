export const routeAccess = {
  '/': 'safe',
  '/users': 'safe',
  '/reports': 'safe',
  '/sign-in': 'unsafe',
  '/privacy-policy': 'neutral',
} as const;
