import { setContext } from '@apollo/client/link/context';
import { Platform } from 'react-native';
import { CSRF_HEADER_NAME, getCSRFToken } from '../../common';

type TAuthLinkArgs = {
  apiUrl: string;
  csrfUrl: string;
};

export function createAuthLink({ apiUrl, csrfUrl }: TAuthLinkArgs) {
  return setContext(async (_, { headers = {} }) => {
    const token = await getCSRFToken(apiUrl, csrfUrl);

    return {
      headers: {
        ...headers,
        ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
        ...(Platform.OS !== 'web' ? { referer: apiUrl } : {}),
      },
    };
  });
}
