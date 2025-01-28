import { sanityClient } from '../sanityClient';
import { normalizeQueryString } from './utils/normalizeQueryString';

const DEFAULT_QUERY = `*[_type == "resource" &&  (resourceType == "alert")]`;

export const fetchAllAlertsAndResourcesByTagsFn = async (tags: string[]) => {
  const queryParams = generateQueryParams(tags);

  return await sanityClient.fetch(queryParams);
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
