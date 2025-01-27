import { CMS_BASE_URL } from '../sanityClient';
import { normalizeQueryString } from './utils/normalizeQueryString';

const DEFAULT_QUERY = `*[_type == "resource" &&  (resourceType == "alert")]`;

export const fetchAllAlertsAndResourcesByTagsFn = async (tags: string[]) => {
  const url = generateUrl(tags);

  const response = await fetch(url);

  return response.json();
};

function generateUrl(tags: string[]): string {
  const queryParams = generateQueryParams(tags);

  const encodedQuery = encodeURIComponent(queryParams);

  return `${CMS_BASE_URL}?query=${encodedQuery}`;
}

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
