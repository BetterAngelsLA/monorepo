import type { ClientFile, FileCategory } from '@monorepo/expo/shared/clients';
import * as R from 'remeda';

export function groupFilesByCategory(
  files: ClientFile[],
  categories: FileCategory[]
) {
  const categoriesById = R.indexBy(categories, (c) => c.id);

  return R.pipe(
    files,
    R.groupBy((f) => f.ref_category),
    R.entries(),
    R.map(([catId, groupFiles]) => ({
      category: categoriesById[Number(catId)] ?? {
        id: Number(catId),
        name: `Category ${catId}`,
        status: 0,
      },
      files: groupFiles,
    }))
  );
}
