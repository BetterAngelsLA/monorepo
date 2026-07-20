import {
  shelterOperationsSegments,
  shelterProfileSegments,
} from './routePaths';

export type TShelterOperationsSegment =
  (typeof shelterOperationsSegments)[keyof typeof shelterOperationsSegments];

export type TShelterProfileSegment =
  (typeof shelterProfileSegments)[keyof typeof shelterProfileSegments];
