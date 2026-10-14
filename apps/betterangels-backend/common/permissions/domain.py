"""Which domains the backend enforces via grants vs legacy (ADR 0001 §4.1).

The per-org permission report and its equivalence tests read this to decide (a)
whether a legacy ``PermissionGroup`` permission is still real for a domain, and
(b) whether the domain's GLOBAL tier (superuser / global Role /
``user_permissions``) is enforceable at any org — and may therefore be folded
into effective per-org entries.  After the org-admin teardown a domain is in
one of two states:

* grant-only — enforced via grants (``can()``/``scopes()``); the global tier is
  enforceable at any org, and legacy ``PermissionGroup`` rows are INERT: not
  reported and never consulted for authority.  ``LEGACY_INERT_APPS`` lists
  these — shelters, teams, reports, and member management (``organizations.*``
  on the org root).  Every ORG_ADMIN/ORG_SUPERUSER template permission is
  grant-backed, so the legacy arm is fully redundant for them.
* legacy-only — enforced via legacy ``PermissionGroup`` rows + guardian (the
  notes/clients caseworker domains); grant rows are irrelevant and the global
  tier is NOT enforceable per org.  Per-org entries carry these permissions
  only from the user's org ``PermissionGroup`` rows (the legacy arm).

The grant-only set is the single source of truth here — it is what the
:func:`accounts.selectors.organization_effective_permissions` fold may include
from the global tier (``GLOBAL_TIER_ORG_APPS`` is that same set, named for what
it drives).  Keep it in step with the ADR §4.1 migration matrix as domains cut
over.
"""

#: Grant-only domains — legacy ``PermissionGroup`` rows are inert: not reported
#: and never consulted for authority.  Shelters, teams, reports, and member
#: management (organizations.* — bound to the org-root Organization model).
LEGACY_INERT_APPS: frozenset[str] = frozenset({"shelters", "teams", "reports", "organizations"})

#: Domains where the global tier is enforceable at any org — exactly the
#: grant-only set (the effective per-org report may fold global-tier
#: permissions of these apps).  Kept as its own name so the fold reads
#: "GLOBAL_TIER_ORG_APPS" without implying the two could diverge.
GLOBAL_TIER_ORG_APPS: frozenset[str] = frozenset(LEGACY_INERT_APPS)
