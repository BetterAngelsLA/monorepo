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
  *[_type == "category"] | order(priority asc) {
    name,
    "slug": slug.current,
    priority,
  "tags": *[
    _type == "resource-tag" &&
    references(^._id) &&
    (${tagsCondition})
  ] {
      "slug": slug.current,
      label,
      "resources": *[
        _type == "resource" &&
        references(^._id)
      ] | order(priority asc) {
        title,
        resourceType,
        description,
        shortDescription,
        "slug": slug.current,
        resourceLink,
        priority,
      }
    }
  }`;

  return query.replace(/\s+/g, ' ').trim();
}

// "description": description[].children[]{
//   _type,
//   marks,
//   text
// },
// "shortDescription": shortDescription[].children[]{
//   _type,
//   marks,
//   text
// },
