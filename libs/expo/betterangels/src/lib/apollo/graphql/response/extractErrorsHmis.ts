import { TFieldError } from '../../../errors/formErrors/types';

export type TErrorsHmis = {
  code?: number;
  status?: number;
  name?: string;
  message?: Record<string, string[]>; // hmis can send message, messages or both
  messages?: Record<string, string[]>;
  fieldErrors?: TFieldError[];
};

export function extractErrorsHmis(hmisError?: string): TErrorsHmis | null {
  if (!hmisError) {
    return null;
  }

  try {
    const errJSON: TErrorsHmis = JSON.parse(hmisError);

    const { code, status, name, message, messages } = errJSON;

    // hmis can send message, messages or both (with same data)
    const errMessages = messages || message;

    // errMessages is a string, return w/o fieldErrors
    if (typeof errMessages === 'string') {
      return {
        code,
        status,
        name,
        message: { message: errMessages },
      };
    }

    const fieldErrors = Object.entries(errMessages || {}).map(
      ([field, fieldMessages = []]) => {
        return {
          field,
          message: fieldMessages.join(', '),
        };
      }
    );

    return {
      code,
      status,
      name,
      messages,
      fieldErrors,
    };
  } catch (e) {
    console.error('[error parsing extractErrorsHmis]', e);

    return {};
  }
}
