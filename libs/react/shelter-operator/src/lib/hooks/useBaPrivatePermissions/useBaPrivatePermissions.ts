import { ContactInfoPermissions } from '@monorepo/ba-platform/permissions';
import { useUser } from '@monorepo/react/shelter';

/** The capability pair every BA-private section exposes. */
type SectionPermissions = {
  canView: boolean;
  canEdit: boolean;
};

/**
 * Capability gates for the BA-private shelter fields.
 *
 * One entry per BA-private section, each tier-honest, plus an area-level
 * `canViewAny` that drives the route gate and the sidebar link. The sections
 * so far: the additional-contacts list, a GLOBAL-tier domain (ADR 0001 §2.4)
 * — the backend gates reads on `can_globally(ContactInfo.VIEW)` and writes on
 * `can_globally(ContactInfo.CHANGE)`. `can_anywhere` would admit a scoped
 * Grant, so only a global Role carrying the ContactInfo perms (the Global
 * Shelter Operator) passes.
 *
 * The FE mirrors that gate on the user's GLOBAL permission list
 * (`currentUser.permissions` via `hasGlobalPermission`) — never on the active
 * org's effective entry: a scoped Role carrying the ContactInfo perms can
 * surface there while `can_globally` still refuses the request (finding H2).
 * Each future section keeps its own tier-honest check here; this hook is the
 * one place that knows how BA-private capabilities are derived.
 *
 * Who reads what:
 * - `BaPrivateGate` and the sidebar link read `canViewAny` only.
 * - A section reads its own entry. `additionalContactsPermissions.canView` has
 *   no consumer yet — with a single section `canViewAny` *is* that read gate,
 *   and `ShelterBaPrivate` uses only `canEdit`. Once a second section lands,
 *   each section must consume its own `canView`: the area gate admits anyone
 *   who can view *any* section, so leaning on it would render a section whose
 *   backend data is withheld (`additional_contacts` resolves to `[]`).
 *
 * Caller notes:
 * - The result is a new object on every render; do not use it (or a section
 *   entry from it) as a `useMemo`/`useEffect` dependency.
 * - The result is fail-closed: `hasGlobalPermission` reads an unresolved user
 *   as denied, so every flag is `false` while the user query is in flight.
 *   Mount consumers under the auth-gated subtree (`OperatorAuthProvider`
 *   renders nothing until the query settles *and* a user exists) — otherwise
 *   "unknown" is indistinguishable from "denied" and a deep link bounces.
 */
export function useBaPrivatePermissions() {
  const { hasGlobalPermission } = useUser();

  // One entry per BA-private section; `satisfies` holds the documented
  // `<name>Permissions: { canView, canEdit }` shape as sections accrue.
  const sections = {
    additionalContactsPermissions: {
      canView: hasGlobalPermission(ContactInfoPermissions.View),
      canEdit: hasGlobalPermission(ContactInfoPermissions.Change),
    },
  } satisfies Record<string, SectionPermissions>;

  return {
    ...sections,
    // Area-level: does the user have anything at all to see under BA private?
    // Intended to gate UI links etc...
    canViewAny: Object.values(sections).some((section) => section.canView),
  };
}
