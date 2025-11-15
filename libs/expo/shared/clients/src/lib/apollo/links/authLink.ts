import { SetContextLink } from '@apollo/client/link/context';
import { Platform } from 'react-native';
import { CSRF_HEADER_NAME, getCSRFToken } from '../../common';

type TAuthLinkArgs = {
  apiUrl: string;
  csrfUrl: string;
};

export function createAuthLink({ apiUrl, csrfUrl }: TAuthLinkArgs) {
  return new SetContextLink(async (prevContext, _operation) => {
    const { headers = {}, ...restContext } = prevContext || {};

    const token = await getCSRFToken(apiUrl, csrfUrl);

    return {
      ...restContext,
      headers: {
        ...headers,
        ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
        ...(Platform.OS !== 'web' ? { referer: apiUrl } : {}),
      },
    };
  });
}
