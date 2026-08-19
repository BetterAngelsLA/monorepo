import { Ordering } from '@monorepo/ba-platform/types';
import { atom } from 'jotai';

export type SortableColumn = 'name' | 'capacity' | 'status';

export type TOperatorShelterSort = {
  column: SortableColumn;
  direction: Ordering;
};

export const DEFAULT_SHELTER_SORT: TOperatorShelterSort = {
  column: 'name',
  direction: Ordering.Asc,
};

export const operatorShelterSortAtom = atom<TOperatorShelterSort>(DEFAULT_SHELTER_SORT);
