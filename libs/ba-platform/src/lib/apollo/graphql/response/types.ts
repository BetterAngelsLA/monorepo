/** A single GraphQL error with typed extensions */
export type GraphQLError = {
  message?: string;
  extensions?: {
    code?: string;
    errors?: ExtensionError[];
  };
};

/** Expected shape of a GraphQL response from the backend */
export type GraphQLResponse = {
  data?: Record<string, unknown> | null;
  errors?: readonly GraphQLError[];
};

/** A raw extension error extracted from a GraphQL response */
export type ExtensionError = {
  field?: string;
  errorCode?: string;
  message?: string;
};

/** A field-level validation error returned from the API */
export type FieldError = {
  field: string;
  message: string;
};
