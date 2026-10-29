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
  these — shelters, teams, reports, member management (``organizations.*`` on
  the org root), the client family's profile/family surfaces (clients, RFC
  0002), and referrals.  Every permission of those apps is grant-backed by a
  scoped Role, so the legacy arm is fully redundant for them — **except client
  documents**: their ownership still rides guardian object rows and two
  mutations still load the parent through ``filter_for_user`` until the
  CREATOR/UPLOADER tier lands, so the document surface is the remaining legacy
  consumer in ``clients.schema`` (see the gating-test exemptions).
* legacy-only — enforced via legacy ``PermissionGroup`` rows + guardian (the
  notes / service-request domains; task and client-document writes ride their
  own tiers next, RFC 0002/0003); grant rows are irrelevant and the global tier
  is NOT enforceable per org.  Per-org entries carry these permissions only
  from the user's org ``PermissionGroup`` rows (the legacy arm).

The grant-only set is the single source of truth here — it is what the
:func:`accounts.selectors.organization_effective_permissions` fold may include
from the global tier (``GLOBAL_TIER_ORG_APPS`` is that same set, named for what
it drives).  Keep it in step with the ADR §4.1 migration matrix as domains cut
over.
"""

#: Grant-only domains — legacy ``PermissionGroup`` rows are inert: not reported
#: and never consulted for authority.  Shelters, teams, reports, member
#: management (organizations.* — bound to the org-root Organization model), the
#: client family (RFC 0002 — SHARED read / SHARED write), and referrals (the
#: whole bundle rides the scoped ``Caseworker`` Role; the template carries no
#: referral permission, so nothing legacy is left to consult).
#:
#: **Client documents and imports are the exception.**  They are still owned
#: through guardian object rows / the legacy permission arm, and two upload
#: mutations still load the parent through ``filter_for_user``, so those
#: permissions keep a live legacy consumer until the CREATOR/UPLOADER tier lands.
#: They are named in :data:`LEGACY_LIVE_PERMISSIONS`, which is what the reporting
#: surfaces consult — don't rely on "inert" for docs or imports.
LEGACY_INERT_APPS: frozenset[str] = frozenset({"shelters", "teams", "reports", "organizations", "clients", "referrals"})

#: Permissions inside an inert app that still have a live legacy consumer.
#:
#: The flag is per app, but the cutover is per permission: these are still
#: honoured by ``user.has_perm`` paths that have not moved to grants (documents'
#: parent load and the import surfaces), so reporting the whole app as inert
#: would make the per-org report and ``explain_permission`` understate real
#: authority — a false negative for exactly the permission those paths check.
LEGACY_LIVE_PERMISSIONS: frozenset[str] = frozenset(
    {
        # document uploads still load the parent through ``filter_for_user``
        "clients.change_clientprofile",
        # the import mutations still gate on the legacy permission
        "clients.add_clientprofileimportrecord",
        # ``bulkClientProfileImportRecords`` still gates on the legacy read
        "clients.view_clientprofileimportrecord",
    }
)


def is_cut_over(perm: str) -> bool:
    """Whether *perm* is enforced by grants only (legacy rows are inert).

    App-level for every domain except the ``LEGACY_LIVE_PERMISSIONS`` carve-out,
    which keeps its legacy consumer until documents and imports cut over.
    """
    app_label = perm.split(".", 1)[0]
    return app_label in LEGACY_INERT_APPS and perm not in LEGACY_LIVE_PERMISSIONS


#: Domains where the global tier is enforceable at any org — exactly the
#: grant-only set (the effective per-org report may fold global-tier
#: permissions of these apps).  Kept as its own name so the fold reads
#: "GLOBAL_TIER_ORG_APPS" without implying the two could diverge.
GLOBAL_TIER_ORG_APPS: frozenset[str] = frozenset(LEGACY_INERT_APPS)
