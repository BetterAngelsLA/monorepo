import { useQuery } from '@apollo/client/react';
import { useActiveOrg } from '@monorepo/ba-platform';
import { AuditActorsDocument } from './__generated__/useAuditActors.generated';

export type AuditActorOption = {
  id: string;
  label: string;
};

/** The backend ignores shorter terms; don't spend a request on them either. */
export const MIN_ACTOR_SEARCH_LENGTH = 2;

type UseAuditActorsArgs = {
  /** Gate the request on `view_org_members` (the backend requires it). */
  enabled?: boolean;
  /** Search term; the query only runs at two or more characters. */
  search?: string;
};

/**
 * Organization members matching *search*, for the audit log's actor filter.
 *
 * The API exposes no actor list for an object's history, so members are the
 * practical source. Requests are on demand: nothing is fetched until *search*
 * has at least two characters (the backend's own floor), and the query is
 * skipped entirely unless *enabled* — callers gate on `view_org_members`, which
 * the backend requires.
 */
export function useAuditActors({
  enabled = true,
  search = '',
}: UseAuditActorsArgs = {}) {
  const { activeOrg } = useActiveOrg();
  const organizationId = activeOrg?.id ?? '';
  const term = search.trim();
  const canSearch =
    enabled &&
    Boolean(organizationId) &&
    term.length >= MIN_ACTOR_SEARCH_LENGTH;

  const { data, loading } = useQuery(AuditActorsDocument, {
    variables: { organizationId, search: term },
    skip: !canSearch,
  });

  const options: AuditActorOption[] = (
    data?.organizationMembers.results ?? []
  ).map((member) => ({
    id: member.id,
    label:
      [member.firstName, member.lastName].filter(Boolean).join(' ').trim() ||
      member.email ||
      'Unknown',
  }));

  return { options, loading };
}
