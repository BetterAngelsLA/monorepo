import { PortableTextBlock } from '@portabletext/react';
import { TResource } from '../types';
import { toTTags } from './toTTag';

function toPortableTextBlocks(item: unknown): PortableTextBlock[] | null {
  if (!Array.isArray(item)) {
    return null;
  }

  if (!item.length) {
    return null;
  }

  return item as PortableTextBlock[];
}

export function toTResources(items: unknown): TResource[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => toTResource(item))
    .filter((resource): resource is TResource => resource !== null);
}

export function toTResource(item: unknown): TResource | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const resource = item as Record<string, unknown>;

  if (typeof resource.title !== 'string') {
    return null;
  }

  if (typeof resource.slug !== 'string') {
    return null;
  }

  if (
    resource.resourceType !== 'resource' &&
    resource.resourceType !== 'alert'
  ) {
    return null;
  }

  return {
    title: resource.title,
    slug: resource.slug,
    resourceType: resource.resourceType,
    tags: toTTags(resource.tags),
    usefulTipsLink:
      typeof resource.usefulTipsLink === 'string'
        ? resource.usefulTipsLink
        : null,
    resourceLink:
      typeof resource.resourceLink === 'string' ? resource.resourceLink : null,
    shortDescription: toPortableTextBlocks(resource.shortDescription),
    tipsDescription: toPortableTextBlocks(resource.tipsDescription),
    priority:
      typeof resource.priority === 'number' &&
      Number.isInteger(resource.priority)
        ? resource.priority
        : undefined,
  };
}
