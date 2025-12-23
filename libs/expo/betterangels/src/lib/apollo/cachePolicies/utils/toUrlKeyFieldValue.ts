import { StoreValue } from '@apollo/client';

export function toUrlKeyFieldValue(url?: StoreValue): string | undefined {
  if (typeof url !== 'string') {
    return undefined;
  }

  const trimmed = url.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    const u = new URL(trimmed);

    return `${u.origin}${u.pathname}`;
  } catch {
    const noHash = trimmed.split('#', 1)[0];
    const noQuery = noHash.split('?', 1)[0];

    return noQuery || undefined;
  }
}
