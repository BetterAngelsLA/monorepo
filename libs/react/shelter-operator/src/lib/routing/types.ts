import { profileRouteConfig } from './routePaths';

export type TShelterProfileSegment =
  (typeof profileRouteConfig.children)[keyof typeof profileRouteConfig.children];
