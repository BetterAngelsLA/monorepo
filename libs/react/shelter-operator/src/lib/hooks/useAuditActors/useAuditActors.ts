import { useQuery } from '@apollo/client/react';
import type { AuditTargetType } from '@monorepo/ba-platform/types';
import { AuditActorsDocument } from './__generated__/useAuditActors.generated';

export type AuditActorOption = {
  /** Null for the synthetic ``System`` entry, selected via ``systemOnly``. */
  id: string | null;
  label: string;
  isSystem: boolean;
};

/** The backend ignores shorter terms; don't spend a request on them either. */
export const MIN_ACTOR_SEARCH_LENGTH = 2;

/** The endpoint's default page of actors, which is also its UI cap. */
const ACTOR_RESULT_LIMIT = 20;

type UseAuditActorsArgs = {
  targetType: AuditTargetType;
  objectId: string;
  /** Search term; the query only runs at two or more characters. */
  search?: string;
};

/**
 * Distinct actors from one object's own audit history, for the actor filter.
 *
 * Unlike `organizationMembers`, this includes global/BA users who acted on the
 * object without belonging to its organization, plus one synthetic `System`
 * entry (`id: null`, selected with `systemOnly`). Requests are on demand:
 * nothing is fetched until *search* has at least two characters.
 */
export function useAuditActors({
  targetType,
  objectId,
  search = '',
}: UseAuditActorsArgs) {
  const term = search.trim();
  const canSearch = Boolean(objectId) && term.length >= MIN_ACTOR_SEARCH_LENGTH;

  const { data, loading } = useQuery(AuditActorsDocument, {
    variables: {
      targetType,
      objectId,
      search: term,
      limit: ACTOR_RESULT_LIMIT,
    },
    skip: !canSearch,
  });

  const options: AuditActorOption[] = (data?.objectAuditActors ?? []).map(
    (actor) => ({
      id: actor.id ?? null,
      label: actor.label,
      isSystem: actor.isSystem,
    }),
  );

  return { options, loading };
}
