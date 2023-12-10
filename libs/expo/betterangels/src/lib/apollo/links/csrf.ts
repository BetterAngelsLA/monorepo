import { ApolloLink, Observable } from '@apollo/client';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../constants';
import { getItem, setItem } from '../../storage';

const csrfTokenRegex = new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`);

export const csrfLink = (apiUrl: string, customFetch = fetch) => {
  return new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      const processOperation = async () => {
        try {
          let csrfToken = await getItem(CSRF_COOKIE_NAME);

          if (!csrfToken) {
            const response = await customFetch(apiUrl, {
              credentials: 'include',
            });
            const cookies = response.headers?.get('Set-Cookie');
            const csrfTokenMatch = cookies?.match(csrfTokenRegex);

            if (csrfTokenMatch?.[1]) {
              csrfToken = csrfTokenMatch[1];
              await setItem(CSRF_COOKIE_NAME, csrfToken);
            }
          }

          operation.setContext(({ headers = {} }) => ({
            headers: {
              ...headers,
              ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
            },
          }));

          forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
        } catch (error) {
          console.error('Error in CSRF Apollo Link:', error);
          observer.error(error);
        }
      };

      processOperation();
    });
  });
};
