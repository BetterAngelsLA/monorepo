import { Ordering } from '@monorepo/ba-platform/types';
import { atomWithReset } from 'jotai/utils';

export type SortableColumn = 'name' | 'capacity' | 'status' | 'organization';

export type TOperatorShelterSort = {
  column: SortableColumn;
  direction: Ordering;
};

export const DEFAULT_SHELTER_SORT: TOperatorShelterSort = {
  column: 'name',
  direction: Ordering.Asc,
};

export const operatorShelterSortAtom =
  atomWithReset<TOperatorShelterSort>(DEFAULT_SHELTER_SORT);
