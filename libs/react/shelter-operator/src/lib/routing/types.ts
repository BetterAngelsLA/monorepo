import { shelterProfileSegments } from './routePaths';

export type TShelterProfileSegment =
  (typeof shelterProfileSegments)[keyof typeof shelterProfileSegments];
