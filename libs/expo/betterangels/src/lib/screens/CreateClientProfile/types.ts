export type TValidationError = {
  field: string;
  location: string | undefined;
  errorCode: string;
};
