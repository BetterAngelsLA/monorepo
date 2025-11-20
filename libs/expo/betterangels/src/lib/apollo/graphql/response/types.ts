export type TApiValidationError = {
  field: string;
  location: string | undefined;
  errorCode: string | number;
  message: string | undefined;
};
