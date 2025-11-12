declare module 'apollo-upload-client/UploadHttpLink.mjs' {
  import { ApolloLink } from '@apollo/client';

  export interface UploadHttpLinkOptions {
    uri?: string;
    credentials?: RequestCredentials;
    headers?: Record<string, string>;
    isExtractableFile?: (value: unknown) => boolean;
  }

  export default class UploadHttpLink extends ApolloLink {
    constructor(options?: UploadHttpLinkOptions);
  }
}
