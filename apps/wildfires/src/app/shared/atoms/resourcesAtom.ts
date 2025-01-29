import { atom } from 'jotai';
import { TResource } from '../clients/sanityCms/types';
import { groupResources } from '../components/surveyResources/SurveyResources';

// read-write atom for resources
export const resourcesAtom = atom<TResource[]>([]);

// read-only atom for filtering base resources
export const baseResourcesAtom = atom((get) => {
  const resources = get(resourcesAtom);
  return resources.filter((r) => r.resourceType === 'resource');
});

// read-only atom for filtering alert resources
export const alertResourcesAtom = atom((get) => {
  const resources = get(resourcesAtom);
  return resources.filter((r) => r.resourceType === 'alert');
});

// read-only atom for grouping and sorting base resources
export const baseResourcesGroupedSortedAtom = atom((get) => {
  const baseResources = get(baseResourcesAtom);
  return groupResources(baseResources); // Ensure groupResources returns something to store
});
