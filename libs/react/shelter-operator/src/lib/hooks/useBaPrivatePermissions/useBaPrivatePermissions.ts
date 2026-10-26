import {
  ContactInfoPermissions,
  ShelterPermissions,
} from '@monorepo/ba-platform/permissions';
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
 * so far: the additional-contacts list (a GLOBAL-tier domain, gated by
 * `can_globally(ContactInfo.VIEW/CHANGE)`) and the shelter review fields
 * (`overall_rating` / `subjective_review` / `declined_ba_visit`, gated by
 * `can_globally(Shelter.VIEW_BA_REVIEW/CHANGE_BA_REVIEW)`). Both are global-tier
 * domains (ADR 0001 §2.4). `can_anywhere` would admit a scoped Grant, so only a
 * global Role carrying those perms (the Global Shelter Operator) passes.
 *
 * The FE mirrors that gate on the user's GLOBAL permission list
 * (`currentUser.permissions` via `hasGlobalPermission`) — never on the active
 * org's effective entry: a scoped Role carrying the ContactInfo perms can
 * surface there while `can_globally` still refuses the request (finding H2).
 * Each future section keeps its own tier-honest check here; this hook is the
 * one place that knows how BA-private capabilities are derived.
 *
 * Who reads what:
 * - Area level: `BaPrivateGate` (route) and the sidebar link read `canViewAny`.
 * - Section level: `ShelterBaPrivate` lists a section only when that section's
 *   `canView` is true, and each section gates its edit affordance on its own
 *   `canEdit`. `canViewAny` is never a substitute for a section's `canView` —
 *   the area gate admits anyone who can view *any* section, so leaning on it
 *   would render a section whose backend data is withheld.
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
    baReviewPermissions: {
      // `change` implies `view`: whoever may edit the review must be able to read it.
      canView:
        hasGlobalPermission(ShelterPermissions.ViewBaReview) ||
        hasGlobalPermission(ShelterPermissions.ChangeBaReview),
      canEdit: hasGlobalPermission(ShelterPermissions.ChangeBaReview),
    },
  } satisfies Record<string, SectionPermissions>;

  return {
    ...sections,
    // Area-level: does the user have anything at all to see under BA private?
    // Intended to gate UI links etc...
    canViewAny: Object.values(sections).some((section) => section.canView),
  };
}
