const BASE_URL =
  'https://4v490tec.api.sanity.io/v2022-03-07/data/query/production';

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

  return `${BASE_URL}?query=${encodedQuery}`;
}

function generateQueryParams(tags: string[]): string {
  const tagsCondition = tags
    .map((tag) => `slug.current == "${tag}"`)
    .join(' || ');

  const query = `
      *[_type == "resource" && references(*[_type == "resource-tag" && (${tagsCondition})]._id)]{
        title,
        resourceType,
        "shortDescription": shortDescription[].children[]{
          _type,
          marks,
          text
        },
        "description": description[].children[]{
          _type,
          marks,
          text
        },
        "slug": slug.current,
        resourceLink,
        priority,
        "tags": tags[]->slug.current
      }`;

  return query.replace(/\s+/g, ' ').trim();
}
