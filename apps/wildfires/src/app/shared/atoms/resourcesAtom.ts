import { atom } from 'jotai';
import { TResource } from '../clients/sanityCms/types';
import { groupResources } from '../components/surveyResources/SurveyResources';

// read-write
export const resourcesAtom = atom<TResource[]>([]);

// read-only
export const baseResourcesAtom = atom((get) => {
  get: {
    const resources = get(resourcesAtom);

    return resources.filter((r) => r.resourceType === 'resource');
  }
});

// read-only
export const alertResourcesAtom = atom((get) => {
  get: {
    const resources = get(resourcesAtom);

    return resources.filter((r) => r.resourceType === 'alert');
  }
});

// read-only
export const baseResourcesGroupedSortedAtom = atom((get) => {
  get: {
    const baseResources = get(baseResourcesAtom);

    groupResources(baseResources);
  }
});
