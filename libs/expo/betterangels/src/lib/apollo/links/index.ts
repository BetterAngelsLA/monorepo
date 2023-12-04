import { ApolloLink } from '@apollo/client';
import { Platform } from 'react-native';
import { CSRF_TOKEN } from '../../constants';
import { setItem } from '../../storage';

export const csrfLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    console.log('inside CSRF Link');
    // This function will be called after the response is received
    const context = operation.getContext();
    const headers = context['response'].headers;

    if (Platform.OS !== 'web' && headers) {
      const cookies = headers.get('Set-Cookie');
      const csrfToken = cookies && /csrftoken=([^;]+);/.exec(cookies)?.[1];
      if (csrfToken) {
        setItem(CSRF_TOKEN, csrfToken); // Asynchronously set the CSRF token
      }
    }
    console.log('inside CSRF Link: resp');

    return response;
  });
});
