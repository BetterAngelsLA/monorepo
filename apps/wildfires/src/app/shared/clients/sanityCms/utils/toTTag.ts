import { TTag } from '../types';
import { toTagCategory } from './toTagCategory';

export function toTTags(items: any): TTag[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const tags = items.map((i) => toTTag(i)).filter((i) => !!i);

  if (!tags) {
    return [];
  }

  return tags as TTag[];
}

export function toTTag(item: any): TTag | undefined {
  if (!item?.slug) {
    return undefined;
  }

  return {
    slug: item.slug,
    label: item.label,
    category: toTagCategory(item.category),
  };
}
