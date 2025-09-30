type TFieldError = {
  fieldName: string;
  message: string;
};

export type THMISErrors = {
  code?: number;
  status?: number;
  name?: string;
  messages?: Record<string, string[]>;
  fieldErrors?: TFieldError[];
};

export function extractHMISErrors(message?: string): THMISErrors | null {
  if (!message) {
    return null;
  }

  try {
    const errJSON: THMISErrors = JSON.parse(message);

    const { code, status, name, messages } = errJSON;

    const fieldErrors = Object.entries(messages || {}).map(
      ([fieldName, fieldMessages]) => {
        return {
          fieldName,
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
