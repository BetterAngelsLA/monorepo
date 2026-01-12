// libs/expo/betterangels/src/lib/apollo/graphql/response/utils/toErrorMessage.ts

export function toErrorMessage(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  // 1. Raw array – typically from GraphQL extensions
  if (Array.isArray(value)) {
    return arrayToMessage(value);
  }

  // 2. String input (including stringified JSON)
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Try JSON.parse for JSON-encoded arrays or strings
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

    // Fallback: handle single-quoted array-like strings, e.g. "['one','two']"
    const singleQuotedArray = parseSingleQuotedArray(trimmed);

    if (singleQuotedArray) {
      return arrayToMessage(singleQuotedArray);
    }

    // If it smells like a broken array-ish string, treat as invalid and log
    if (looksLikeBrokenArrayishString(trimmed)) {
      console.warn(
        '[toErrorMessage] Received malformed array-like error message:',
        trimmed
      );

      return undefined;
    }

    // Otherwise it is just a plain string
    return trimmed;
  }

  // 3. Any other non-string scalar or object is considered invalid
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

/**
 * Parse strings like:
 * - "['one']"
 * - "['one','two']"
 * - "['one', 'two', 'three']"
 *
 * Returns an array of inner string values, or null if the pattern does not match.
 */
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
    // rawElement is like "'foo'"
    const cleaned = rawElement.slice(1, rawElement.length - 1);
    normalizedValues.push(cleaned);
  }

  return normalizedValues;
}

/**
 * Heuristic check for strings that look like a broken array / array-like wrapper.
 * If this returns true, we treat the message as invalid and return undefined.
 */
function looksLikeBrokenArrayishString(value: string): boolean {
  const trimmed = value.trim();

  const hasOpeningBracket = trimmed.includes('[');
  const hasClosingBracket = trimmed.includes(']');
  const singleQuoteMatches = trimmed.match(/'/g);
  const singleQuoteCount = singleQuoteMatches ? singleQuoteMatches.length : 0;

  // Unbalanced brackets
  if (hasOpeningBracket !== hasClosingBracket) {
    return true;
  }

  // Odd number of single quotes is suspicious
  if (singleQuoteCount % 2 === 1) {
    return true;
  }

  // Starts with "[" but does not end with "]"
  if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
    return true;
  }

  return false;
}
