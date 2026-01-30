import type { ClientFile, FileCategory } from '@monorepo/expo/shared/clients';

export function groupFilesByCategory(
  files: ClientFile[],
  categories: FileCategory[]
) {
  const byRefCategory = new Map<number, ClientFile[]>();

  for (const file of files) {
    const list = byRefCategory.get(file.ref_category) ?? [];
    list.push(file);
    byRefCategory.set(file.ref_category, list);
  }

  const result: { category: FileCategory | undefined; files: ClientFile[] }[] =
    [];

  for (const cat of categories) {
    const list = byRefCategory.get(cat.id);
    if (list?.length) {
      result.push({ category: cat, files: list });
      byRefCategory.delete(cat.id);
    }
  }

  byRefCategory.forEach((fileList, refCategory) => {
    result.push({
      category: {
        id: refCategory,
        name: `Category ${refCategory}`,
        status: 0,
      },
      files: fileList,
    });
  });

  return result;
}
