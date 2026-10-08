import { useQuery } from '@apollo/client/react';
import { useActiveOrg } from '@monorepo/ba-platform';
import { AuditActorsDocument } from './__generated__/useAuditActors.generated';

export type AuditActorOption = {
  id: string;
  label: string;
};

/**
 * Organization members available as actor options for the audit log filter.
 *
 * The API exposes no actor list for an object's history, so members are the
 * practical source. Note the backend requires `view_org_members`, so callers
 * must gate the actor filter on that permission.
 */
export function useAuditActors() {
  const { activeOrg } = useActiveOrg();
  const organizationId = activeOrg?.id ?? '';

  const { data, loading } = useQuery(AuditActorsDocument, {
    variables: { organizationId },
    skip: !organizationId,
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
