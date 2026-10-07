/**
 * HMIS occasionally returns JSON with a wrong/missing Content-Type or a
 * double-encoded JSON string — parse defensively (same as `clientHmis`).
 */
export const parseHmisProdBody = (text: string | null): unknown => {
  if (!text) return text;

  try {
    const parsed: unknown = JSON.parse(text);

    if (typeof parsed === 'string') {
      try {
        return JSON.parse(parsed);
      } catch {
        return parsed;
      }
    }

    return parsed;
  } catch {
    return text;
  }
};
