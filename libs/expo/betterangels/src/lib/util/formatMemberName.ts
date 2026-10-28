type TMemberName = {
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * Render a member as `First Last`, dropping the blanks.
 *
 * Both name fields are optional on the API and half-filled profiles are
 * common, so this never renders a stray separator or the text "undefined".
 */
export function formatMemberName(member?: TMemberName | null): string {
  if (!member) return '';

  return [member.firstName, member.lastName].filter(Boolean).join(' ');
}
