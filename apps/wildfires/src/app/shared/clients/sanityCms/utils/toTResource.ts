import { PortableTextBlock } from '@portabletext/react';
import { TResource } from '../types';

function toPortableTextBlock(item: any): PortableTextBlock | null {
  if (!Array.isArray(item)) {
    return null;
  }

  return item as unknown as PortableTextBlock;
}

export function toTResources(items: any): TResource[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const resources = items.map((r) => toTResource(r)).filter((r) => !!r);

  return resources as TResource[];
}

export function toTResource(item: any): TResource | null {
  if (!item?.title) {
    return null;
  }

  return {
    title: item.title,
    slug: item.slug,
    resourceType: item.resourceType,
    resourceLink: item.resourceLink,
    priority: item.priority,
    tags: item.tags,
    description: toPortableTextBlock(item.description),
    shortDescription: toPortableTextBlock(item.shortDescription),
  } as unknown as TResource;
}
