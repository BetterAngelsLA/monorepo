import { CMS_BASE_URL } from '../sanityClient';

export const fetchResourcesByTagsFn = async (tags: string[]) => {
  if (!tags.length) {
    throw new Error(`fetchResourcesByTagsFn: tags required`);
  }

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
  const tagsCondition = tags
    .map((tag) => `slug.current == "${tag}"`)
    .join(' || ');

  const query = `
    *[_type == "resource" && references(*[_type == "resource-tag" && (${tagsCondition})]._id)]{
      "slug": slug.current,
      priority,
      resourceType,
      title,
      description,
      shortDescription,
      resourceLink,
      usefulTipsLink,
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

  return query.replace(/\s+/g, ' ').trim();
}
