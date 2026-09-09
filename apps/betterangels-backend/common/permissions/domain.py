"""Which domains the backend enforces via grants vs legacy (ADR 0001 §4.1).

The per-org permission report and its equivalence tests read THIS to decide (a)
whether a legacy ``PermissionGroup`` permission is still real for a domain, and
(b) whether the domain's GLOBAL tier (superuser / global Role /
``user_permissions``) is enforceable at any org — and may therefore be folded
into effective per-org entries.  During the transition a domain is in one of
three states:

* legacy-only — enforced via ``PermissionGroup`` (``HasOrgPerm``); grant rows
  are irrelevant and the global tier is NOT enforceable per org (the predicate
  reads org ``PermissionGroup`` rows only — never ``user_permissions``,
  superuser, or global Roles).  Per-org entries may carry these permissions
  only from the user's org ``PermissionGroup`` rows (the legacy arm).
* dual — enforced via legacy OR grant (``HasOrgPermOrGrant``, ADR §5.3): the
  global tier becomes enforceable per org once the grant arm is live.  Empty
  until PRs #2427-2429.
* grant-only — enforced via grants (``can()``/``scopes()``); the global tier is
  enforceable at any org, and legacy rows are INERT and must not be reported
  (e.g. shelters in #2412).

``LEGACY_INERT_APPS`` lists the grant-only domains — the only state in which
legacy permissions must be suppressed from reports.  ``GLOBAL_TIER_ORG_APPS``
(grant-only ∪ dual) names the domains whose global-tier permissions the
:func:`accounts.selectors.organization_effective_permissions` fold may include.
Keep both in step with the ADR §4.1 migration matrix.
"""

#: Grant-only domains — legacy ``PermissionGroup`` rows are inert (suppressed).
#: Shelters cut over directly to grants (#2412) and never pass through dual-read,
#: so this set is final for them.
LEGACY_INERT_APPS: frozenset[str] = frozenset({"shelters"})

#: Dual-read domains (``can()`` OR legacy, ADR §5.3) — reserved for the still-
#: legacy-only domains' cutover (#2427-2429: member management, reports, teams).
#: Empty today; each app that joins also unlocks that domain's global-tier fold.
DUAL_APPS: frozenset[str] = frozenset()

#: Domains where the global tier is enforceable at any org (grant-only ∪ dual);
#: the effective per-org report folds global-tier permissions of these apps.
GLOBAL_TIER_ORG_APPS: frozenset[str] = LEGACY_INERT_APPS | DUAL_APPS
