export function toErrorMessage(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return arrayToMessage(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(trimmed);
    } catch {
      parsedJson = null;
    }

    if (Array.isArray(parsedJson)) {
      return arrayToMessage(parsedJson);
    }

    if (typeof parsedJson === 'string') {
      return parsedJson;
    }

    const singleQuotedArray = parseSingleQuotedArray(trimmed);

    if (singleQuotedArray) {
      return arrayToMessage(singleQuotedArray);
    }

    if (looksLikeBrokenArrayishString(trimmed)) {
      console.warn(
        '[toErrorMessage] Received malformed array-like error message:',
        trimmed
      );

      return undefined;
    }

    return trimmed;
  }

  console.warn(
    '[toErrorMessage] Received non-string, non-array error value. Ignoring:',
    value
  );

  return undefined;
}

function arrayToMessage(array: unknown[]): string | undefined {
  const stringParts: string[] = [];

  for (const element of array) {
    if (typeof element === 'string') {
      const trimmedElement = element.trim();
      stringParts.push(trimmedElement);
      continue;
    }

    console.warn(
      '[toErrorMessage] Skipping non-string element in error message array:',
      element
    );
  }

  if (stringParts.length === 0) {
    return undefined;
  }

  return stringParts.join(', ');
}

function parseSingleQuotedArray(input: string): string[] | null {
  const trimmed = input.trim();

  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
    return null;
  }

  const inner = trimmed.slice(1, -1).trim();

  if (!inner.includes("'")) {
    return null;
  }

  const matches = inner.match(/'([^']*)'/g);

  if (!matches) {
    return null;
  }

  const normalizedValues: string[] = [];

  for (const rawElement of matches) {
    normalizedValues.push(rawElement.slice(1, rawElement.length - 1));
  }

  return normalizedValues;
}

function looksLikeBrokenArrayishString(value: string): boolean {
  const trimmed = value.trim();

  const hasOpeningBracket = trimmed.includes('[');
  const hasClosingBracket = trimmed.includes(']');
  const singleQuoteMatches = trimmed.match(/'/g);
  const singleQuoteCount = singleQuoteMatches ? singleQuoteMatches.length : 0;

  if (hasOpeningBracket !== hasClosingBracket) {
    return true;
  }

  if (singleQuoteCount % 2 === 1) {
    return true;
  }

  if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
    return true;
  }

  return false;
}