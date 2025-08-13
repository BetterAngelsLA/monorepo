export const routeAccess = {
  '/': 'safe',
  '/users': 'safe',
  '/sign-in': 'unsafe',
  '/privacy-policy': 'neutral',
} as const;

type AccessType = 'safe' | 'unsafe' | 'neutral';

export function getRouteAccess(pathname: string): AccessType {
  const sortedRoutes = Object.keys(routeAccess).sort(
    (a, b) => b.length - a.length
  );
  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      return routeAccess[route as keyof typeof routeAccess];
    }
  }

  return 'neutral';
}
