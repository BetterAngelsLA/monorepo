import { TTagCategory } from '../types';

export function toTagCategory(item: any): TTagCategory | undefined {
  if (!item?.slug || !item.name) {
    return undefined;
  }

  return {
    slug: item.slug,
    name: item.name,
    priority: Number.isInteger(item.priority) ? item.priority : undefined,
  };
}
