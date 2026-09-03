"""Which domains the backend enforces via grants vs legacy (ADR 0001 §4.1).

The per-org permission report and its equivalence tests read THIS to decide
whether a legacy ``PermissionGroup`` permission is still real for a domain.
During the transition a domain is in one of three states:

* legacy-only — enforced via ``PermissionGroup``; grant rows are irrelevant.
* dual — enforced via legacy OR grant (``HasOrgPermOrGrant``, ADR §5.3).
* grant-only — enforced via grants; legacy rows are INERT and must not be
  reported (the domain has cut over, e.g. shelters in #2412).

``LEGACY_INERT_APPS`` lists the grant-only domains — the only state in which
legacy permissions must be suppressed from reports.  Keep it in step with the
ADR §4.1 migration matrix.
"""

LEGACY_INERT_APPS: frozenset[str] = frozenset({"shelters"})
