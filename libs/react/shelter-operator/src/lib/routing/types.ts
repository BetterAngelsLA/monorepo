import { mgmtRouteConfig, profileRouteConfig } from './routePaths';

export type TShelterProfileSegment =
  (typeof profileRouteConfig.children)[keyof typeof profileRouteConfig.children];

export type TShelterMgmtSegment =
  (typeof mgmtRouteConfig.children)[keyof typeof mgmtRouteConfig.children];
