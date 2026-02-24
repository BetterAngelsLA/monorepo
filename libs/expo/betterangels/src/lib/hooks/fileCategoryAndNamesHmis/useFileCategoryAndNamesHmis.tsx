import type { FileCategory, FileName } from '@monorepo/expo/shared/clients';
import { fetchAllPages } from '@monorepo/expo/shared/clients';
import { useQuery } from '@tanstack/react-query';
import { useClientHmis } from '../useClientHmis';

import {
  FileCategoriesArraySchemaHmis,
  FileNamesArraySchemaHmis,
} from './schemas';
import { validateNameCategories } from './validateNameCategories';

type TResult = {
  categories: FileCategory[];
  fileNames: FileName[];
  loading: boolean;
  error: Error | null;
};

export function useFileCategoryAndNamesHmis(): TResult {
  const { getFileCategories, getFileNames } = useClientHmis();

  const query = useQuery({
    queryKey: ['hmis', 'file-upload-metadata'],
    staleTime: 5 * 60 * 60_000, // 5 hours
    gcTime: 12 * 60 * 60_000, // 12 hours
    retry: 1,
    refetchOnMount: false,

    queryFn: async () => {
      const [categories, fileNames] = await Promise.all([
        fetchAllPages<FileCategory>(getFileCategories),
        fetchAllPages<FileName>(getFileNames),
      ]);

      const categoriesResult =
        FileCategoriesArraySchemaHmis.safeParse(categories);

      if (!categoriesResult.success) {
        const msg =
          '[useFileCategoryAndNamesHmis] Invalid file category schema';
        console.error(msg, categoriesResult.error);
        throw new Error(msg);
      }

      const fileNamesResult = FileNamesArraySchemaHmis.safeParse(fileNames);

      if (!fileNamesResult.success) {
        const msg = '[useFileCategoryAndNamesHmis] Invalid file name schema';
        console.error(msg, fileNamesResult.error);
        throw new Error(msg);
      }

      const validationError = validateNameCategories({
        categories: categoriesResult.data,
        fileNames: fileNamesResult.data,
      });

      if (validationError) {
        console.error(
          '[useHmisFileCategoryAndNames] Cross-reference validation failed',
          validationError
        );
        throw validationError;
      }

      return {
        categories: categoriesResult.data,
        fileNames: fileNamesResult.data,
      };
    },
  });

  return {
    categories: query.data?.categories ?? [],
    fileNames: query.data?.fileNames ?? [],
    loading: query.isPending,
    error: query.error,
  };
}
