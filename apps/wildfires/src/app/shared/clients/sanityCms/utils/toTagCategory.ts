import { TTagCategory } from '../types';

export function toTagCategory(item: unknown): TTagCategory | undefined {
  if (!item || typeof item !== 'object') {
    return undefined;
  }

  const category = item as Record<string, unknown>;

  if (typeof category.slug !== 'string') {
    return undefined;
  }

  if (typeof category.name !== 'string') {
    return undefined;
  }

  return {
    slug: category.slug,
    name: category.name,
    priority:
      typeof category.priority === 'number' &&
      Number.isInteger(category.priority)
        ? category.priority
        : undefined,
  };
}
