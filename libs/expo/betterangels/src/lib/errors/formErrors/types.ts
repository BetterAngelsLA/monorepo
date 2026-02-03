export type TFormValidationError = {
  field: string;
  location: string | undefined;
  errorCode: string;
};

export type TFieldError = {
  field: string;
  message: string;
};
