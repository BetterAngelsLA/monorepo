import { IClusterGeoJson } from '@monorepo/expo/shared/ui-components';

export interface TClusterInteraction extends IClusterGeoJson {
  interactedAt: Date;
  mostRecent: boolean;
}
