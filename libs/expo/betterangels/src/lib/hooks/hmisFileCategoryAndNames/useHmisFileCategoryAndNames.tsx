import { useQuery } from '@tanstack/react-query';
import { useHmisClient } from '../useHmisClient';

import { fetchAllPages } from './fetchAllPages';
import {
  HmisFileCategoriesArraySchema,
  HmisFileNamesArraySchema,
} from './schemas';
import { validateNameCategories } from './validateNameCategories';

import type { FileCategory, FileName } from '@monorepo/expo/shared/clients';

type TResult = {
  categories: FileCategory[];
  fileNames: FileName[];
  loading: boolean;
  error: Error | null;
};

export function useHmisFileCategoryAndNames(): TResult {
  const { getFileCategories, getFileNames } = useHmisClient();

  const query = useQuery({
    queryKey: ['hmis', 'file-upload-metadata'],
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 12 * 60 * 60_000, // 12 hours
    retry: 1,
    refetchOnMount: false,

    queryFn: async () => {
      const [categories, fileNames] = await Promise.all([
        fetchAllPages<FileCategory>(getFileCategories),
        fetchAllPages<FileName>(getFileNames),
      ]);

      const categoriesResult =
        HmisFileCategoriesArraySchema.safeParse(categories);

      if (!categoriesResult.success) {
        const msg =
          '[useHmisFileCategoryAndNames] Invalid file category schema';
        console.error(msg, categoriesResult.error);
        throw new Error(msg);
      }

      const fileNamesResult = HmisFileNamesArraySchema.safeParse(fileNames);

      if (!fileNamesResult.success) {
        const msg = '[useHmisFileCategoryAndNames] Invalid file name schema';
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
