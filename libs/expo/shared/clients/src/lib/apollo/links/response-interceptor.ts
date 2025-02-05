// libs/expo/shared/clients/src/lib/apollo/links/response-interceptor.ts
import { ApolloLink, FetchResult } from '@apollo/client';
import { CSRF_COOKIE_NAME } from './constants';
import { csrfManager } from './csrf-manager';

export const responseInterceptor = new ApolloLink((operation, forward) => {
  return forward(operation).map((response: FetchResult) => {
    // Get the context from the operation. We assume that earlier links have
    // set properties like `response` and `restResponses` in the operation context.
    const { response: httpResponse, restResponses } =
      operation.getContext() as {
        response?: Response;
        restResponses?: Response[];
      };

    // Combine any available Set-Cookie headers.
    const cookies = [
      httpResponse?.headers.get('set-cookie'),
      ...(restResponses || []).map((res) => res.headers.get('set-cookie')),
    ]
      .filter(Boolean)
      .join('; ');

    // Extract the CSRF token from the combined cookies.
    const match = cookies.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) {
      csrfManager.setToken(match[1]); // Ensure setToken exists in the manager.
    }

    return response;
  });
});
