from clients.models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    HmisProfile,
    SocialMediaProfile,
)
from common.models import Attachment
from common.permissions.config import RoleDef, TemplateConfig
from notes.models import Note, ServiceRequest
from referrals.models import Referral
from tasks.models import Task
from teams.models import Team

CASEWORKER = TemplateConfig(
    name="Caseworker",
    permissions=[
        # Note: ADD + VIEW only
        Note.perms.ADD,
        Note.perms.VIEW,
        # ServiceRequest: ADD only (VIEW, CHANGE, DELETE granted per-object at creation)
        ServiceRequest.perms.ADD,
        # Client models: full CRUD
        ClientProfile.perms.ADD,
        ClientProfile.perms.CHANGE,
        ClientProfile.perms.DELETE,
        ClientProfile.perms.VIEW,
        ClientContact.perms.ADD,
        ClientContact.perms.CHANGE,
        ClientContact.perms.DELETE,
        ClientContact.perms.VIEW,
        ClientHouseholdMember.perms.ADD,
        ClientHouseholdMember.perms.CHANGE,
        ClientHouseholdMember.perms.DELETE,
        ClientHouseholdMember.perms.VIEW,
        HmisProfile.perms.ADD,
        HmisProfile.perms.CHANGE,
        HmisProfile.perms.DELETE,
        HmisProfile.perms.VIEW,
        SocialMediaProfile.perms.ADD,
        SocialMediaProfile.perms.CHANGE,
        SocialMediaProfile.perms.DELETE,
        SocialMediaProfile.perms.VIEW,
        # Referral: grant-only — the capability rides CASEWORKER_ROLE below.
        # Keeping it out of the template is what makes the legacy
        # ``PermissionGroup`` arm inert for referrals (ADR 0001 §4.1); a
        # model-level copy here would be global and bypass the org scope.
        # Task: ADD + VIEW only
        Task.perms.ADD,
        Task.perms.VIEW,
        # Attachment: ADD + VIEW
        Attachment.perms.ADD,
        Attachment.perms.VIEW,
        # Teams: VIEW only (role-backed below).
        Team.perms.VIEW,
    ],
    invite_html="account/email/email_invite_organization.html",
    invite_txt="account/messages/email_invite_organization.txt",
)


# ── Role definition (ADR 0001 §2.2 — scoped caseworker capability) ───────
# The scoped ``Caseworker`` Role is exercised only through a ``Grant``
# (``OrgRoleManager`` / ``backfill_caseworker_grants``), so these stay
# org-scoped: a caseworker at org A reaches org A's rows and nothing else.
#
# Referrals are the first domain to ride the Role for its whole bundle
# (add/change/view/delete) instead of the legacy template.  DELETE is
# deliberately here rather than per-object at creation: the scoped Role cannot
# leak globally, so "any caseworker at this org may delete this org's
# referral" is the same authority the creation-time guardian rows granted to
# the whole org group, without writing per-record rows (ADR 0001 §2.1 rule 4).
# The rest of the bundle — notes, clients, tasks — stays legacy until RFC 0003,
# so keep ``CASEWORKER_ROLE`` a deliberate subset rather than deriving it from
# the template.
CASEWORKER_ROLE = RoleDef(
    name=CASEWORKER.name,
    permissions=[
        Team.perms.VIEW,
        Referral.perms.ADD,
        Referral.perms.CHANGE,
        Referral.perms.VIEW,
        Referral.perms.DELETE,
    ],
    is_invitable=CASEWORKER.is_invitable,
)
