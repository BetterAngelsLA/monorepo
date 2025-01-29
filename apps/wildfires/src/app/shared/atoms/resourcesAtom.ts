import { atomWithStorage } from 'jotai/utils';
import { TResource } from '../clients/sanityCms/types';

const cacheKey = 'wildfireSurveyResources';

export const resourcesAtom = atomWithStorage<TResource[] | []>(cacheKey, []);
