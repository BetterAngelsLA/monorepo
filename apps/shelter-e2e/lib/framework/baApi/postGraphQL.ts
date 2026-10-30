import type { Page } from '@playwright/test';

const GRAPHQL_PATH = '/graphql';
const CSRF_COOKIE_NAME = 'csrftoken';
const CSRF_HEADER_NAME = 'x-csrftoken';
const CSRF_LOGIN_PATH = '/admin/login/';

/** The API the environment under test talks to. */
const API_URL = process.env['SHELTER_API_URL'] ?? 'http://localhost:8000';

/**
 * Posts a GraphQL operation through the browser context, so the request shares
 * the page's cookies with the app.
 *
 * Django requires a CSRF token on every POST. The app's client fetches one from
 * the admin login endpoint when the cookie is missing, so this does the same —
 * the `Set-Cookie` lands in the context's jar, which `page.request` sends.
 */
export async function postGraphQL<TData>(
  page: Page,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<TData> {
  const csrfToken = await readCsrfToken(page);

  const response = await page.request.post(`${API_URL}${GRAPHQL_PATH}`, {
    data: { query, variables },
    headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {},
  });

  if (!response.ok()) {
    throw new Error(
      `GraphQL request failed: ${response.status()} ${await response.text()}`,
    );
  }

  const body = await response.json();

  if (body?.errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  }

  return body.data as TData;
}

async function readCsrfToken(page: Page): Promise<string | undefined> {
  const token = await findCsrfCookie(page);

  if (token) {
    return token;
  }

  await page.request.get(`${API_URL}${CSRF_LOGIN_PATH}?t=${Date.now()}`);

  return findCsrfCookie(page);
}

async function findCsrfCookie(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies(API_URL);

  return cookies.find(({ name }) => name === CSRF_COOKIE_NAME)?.value;
}
