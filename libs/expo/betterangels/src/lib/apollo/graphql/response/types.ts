export type TApiValidationError = {
  field: string;
  location: string | undefined;
  errorCode: string;
  message: string | undefined;
};
