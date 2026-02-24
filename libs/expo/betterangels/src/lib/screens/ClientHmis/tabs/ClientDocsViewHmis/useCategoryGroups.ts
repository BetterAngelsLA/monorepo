import type { FileCategory, FileName } from '@monorepo/expo/shared/clients';
import { useMemo } from 'react';

export type CategoryGroup = {
  categoryId: string;
  categoryName: string;
  types: { value: string; displayValue: string }[];
};

export function useCategoryGroups(
  categories: FileCategory[],
  subCategories: FileName[]
): CategoryGroup[] {
  return useMemo(() => {
    return categories
      .filter((category) => category.status === 1)
      .map((category) => {
        const types = subCategories
          .filter((sub) => sub.status === 1 && sub.ref_category === category.id)
          .map((sub) => ({
            value: String(sub.id),
            displayValue: sub.name,
          }));

        return {
          categoryId: String(category.id),
          categoryName: category.name,
          types,
        };
      })
      .filter((group) => group.types.length > 0);
  }, [categories, subCategories]);
}
