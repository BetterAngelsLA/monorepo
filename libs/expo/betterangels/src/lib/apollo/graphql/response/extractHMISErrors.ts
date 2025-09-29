export type THMISErrors = {
  code?: number;
  status?: number;
  name?: string;
  messages?: Record<string, string[]>;
};

export function extractHMISErrors(message?: string): THMISErrors | null {
  if (!message) {
    return null;
  }

  try {
    const errJSON: THMISErrors = JSON.parse(message);

    const { code, status, name, messages } = errJSON;

    return {
      code,
      status,
      name,
      messages,
    };
  } catch (e) {
    console.error('[error parsing extractHMISErrors]', e);

    return null;
  }
}
