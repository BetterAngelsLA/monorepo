import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { userPreferencesAtomFamily } from './userPreferencesAtomFamily';

export const userPreferencesOrganizationAtomFamily = atomFamily(
  (userId: string) => {
    const preferencesAtom = userPreferencesAtomFamily(userId);

    return atom(
      (get) => {
        return get(preferencesAtom).organizationId;
      },
      (_get, set, nextOrganizationId: string | null) => {
        set(preferencesAtom, (prev) => ({
          ...prev,
          organizationId: nextOrganizationId,
        }));
      }
    );
  }
);
