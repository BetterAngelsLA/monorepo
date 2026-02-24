import type { FileCategory, FileName } from '@monorepo/expo/shared/clients';

type TProps = {
  categories: FileCategory[];
  fileNames: FileName[];
};

export function validateNameCategories(props: TProps): Error | null {
  const { categories, fileNames } = props;

  let error: Error | null = null;

  const categoryIds = new Set(categories.map((c) => c.id));

  for (const fileName of fileNames) {
    if (!categoryIds.has(fileName.ref_category)) {
      const errorMessage = `FileName ${fileName.id} references missing category ${fileName.ref_category}`;

      error = new Error(errorMessage);

      break;
    }
  }

  return error;
}
