export type TFormValidationError = {
  field: string;
  errorCode: string;
  location?: string;
  message?: string;
};

export type TFieldError = {
  field: string;
  message: string;
};
