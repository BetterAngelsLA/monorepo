import { TTag } from '../types';

import { toTagCategory } from './toTagCategory';

export function toTTags(items: unknown): TTag[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => toTTag(item))
    .filter((tag): tag is TTag => tag !== undefined);
}

export function toTTag(item: unknown): TTag | undefined {
  if (!item || typeof item !== 'object') {
    return undefined;
  }

  const tag = item as Record<string, unknown>;

  if (typeof tag.slug !== 'string') {
    return undefined;
  }

  if (typeof tag.label !== 'string') {
    return undefined;
  }

  return {
    slug: tag.slug,
    label: tag.label,
    category: toTagCategory(tag.category),
  };
}
