/**
 * Parses the error thrown by an S3 upload call.
 *
 * S3 returns XML error bodies like:
 *   <?xml...><Error><Code>EntityTooLarge</Code><Message>Your proposed upload...</Message>...</Error>
 *
 * This function extracts the human-readable <Message> when available and
 * returns a user-facing string. Falls back to the original error message
 * for non-S3 errors.
 */
export function parseS3Error(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred.';
  }

  // Match the S3 XML <Message> element
  const match = error.message.match(/<Message>(.+?)<\/Message>/);
  return match ? match[1] : error.message;
}
