import { sanityClient } from '../sanityClient';
import { TResource } from '../types';
import { toTResources } from '../utils/toTResource';
import { normalizeQueryString } from './utils/normalizeQueryString';

const DEFAULT_QUERY = `*[_type == "resource" &&  (resourceType == "alert")]`;

export const fetchAllAlertsAndResourcesByTagsFn = async (
  tags: string[]
): Promise<TResource[]> => {
  try {
    const queryParams = generateQueryParams(tags);

    const response = await sanityClient.fetch(queryParams);

    if (!Array.isArray(response)) {
      throw new Error('invalid response');
    }

    return toTResources(response);
  } catch (error) {
    let errorMessage = 'Unknown error';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`Failed to fetch resouces from Sanity: ${errorMessage}`);

    return [];
  }
};

function generateQueryParams(tags: string[]): string {
  if (!tags.length) {
    return normalizeQueryString(DEFAULT_QUERY);
  }

  const tagsCondition = tags
    .map((tag) => `slug.current == "${tag}"`)
    .join(' || ');

  const query = `
    *[
        _type == "resource" && (
            references(*[_type == "resource-tag" && (${tagsCondition})]._id)
            || (resourceType == "alert")
        )
    ]{
      "slug": slug.current,
      priority,
      resourceType,
      title,
      shortDescription,
      resourceLink,
      tipsDescription,
      "tags": tags[]->{
        label,
        "slug": slug.current,
        category->{
          name,
          "slug": slug.current,
          priority,
        }
      }
    }`;

  return normalizeQueryString(query);
}
