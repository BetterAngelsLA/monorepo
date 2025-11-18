import { TFieldError } from '../../../errors/formErrors/types';

export type THMISErrors = {
  code?: number;
  status?: number;
  name?: string;
  message?: Record<string, string[]>; // hmis can send message, messages or both
  messages?: Record<string, string[]>;
  fieldErrors?: TFieldError[];
};

export function extractHMISErrors(hmisError?: string): THMISErrors | null {
  if (!hmisError) {
    return null;
  }

  try {
    const errJSON: THMISErrors = JSON.parse(hmisError);

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
        // NOTE: field names returned with update mutation can be inconsistent with inputs.
        const fieldName = field === 'nameQuality' ? 'nameDataQuality' : field;

        return {
          field: fieldName,
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
    console.error('[error parsing extractHMISErrors]', e);

    return {};
  }
}
