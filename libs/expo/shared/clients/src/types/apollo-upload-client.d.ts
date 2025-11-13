declare module 'apollo-upload-client/UploadHttpLink.mjs' {
  import type { ApolloLink } from '@apollo/client';

  export type UploadLinkOptions = {
    uri?: string;
    includeExtensions?: boolean;
    credentials?: RequestCredentials;
    headers?: Record<string, string>;
    fetch?: typeof fetch;
    fetchOptions?: RequestInit;
    isExtractableFile?: (value: unknown) => boolean;
    FormData?: typeof globalThis.FormData;
  };

  export default class UploadHttpLink extends ApolloLink {
    constructor(options?: UploadLinkOptions);
  }
}
