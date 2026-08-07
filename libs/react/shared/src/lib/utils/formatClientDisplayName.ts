/**
 * Composes a client profile display name from a name-bearing object.
 *
 * Format: "<firstName> <middleName> <lastName> (<nickname>)"
 *
 * Missing/null/blank fields are omitted. If no name fields are provided,
 * returns an empty string.
 *
 * Examples:
 *   - { firstName: "John", middleName: "Xavier", lastName: "Doe", nickname: "Johnny" } → "John Xavier Doe (Johnny)"
 *   - { firstName: "John", lastName: "Doe" }                                      → "John Doe"
 *   - { nickname: "Slim" }                                                        → "(Slim)"
 */
export function formatClientDisplayName(client: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
}): string {
  const namePart = [client.firstName, client.middleName, client.lastName]
    .filter((s): s is string => !!s?.trim())
    .join(' ')
    .trim();

  if (client.nickname) {
    const nicknamePart = `(${client.nickname})`;
    return namePart ? `${namePart} ${nicknamePart}` : nicknamePart;
  }

  return namePart;
}
