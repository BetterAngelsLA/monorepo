type TParsedError = {
  code?: number;
  status?: number;
  name?: string;
  message?: string;
};

export function parseError(error?: string): TParsedError {
  if (!error) {
    return {};
  }

  try {
    const errJSON: TParsedError = JSON.parse(error);

    const { code, status, name, message } = errJSON;

    return {
      code,
      status,
      name,
      message,
    };
  } catch (e) {
    console.error('[useHmisClientPrograms.parseError error]', e);

    return {};
  }
}
