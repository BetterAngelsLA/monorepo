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
        # Task: ADD + VIEW only
        Task.perms.ADD,
        Task.perms.VIEW,
        # Attachment: ADD + VIEW
        Attachment.perms.ADD,
        Attachment.perms.VIEW,
        # Teams: VIEW only — workers pick teams on notes/tasks, and the
        # teams read authorizes via this permission (grant-based) once the
        # role below is backfilled.
        Team.perms.VIEW,
    ],
    invite_html="account/email/email_invite_organization.html",
    invite_txt="account/messages/email_invite_organization.txt",
)


# ── Role definition (ADR 0001 §2.2 — caseworker teams-read slice) ────────
# Role-backing CASEWORKER is the first step of RFC 0003 (caseworker
# guardian-equivalence): a scoped ``Caseworker`` Role carrying
# ``teams.view_team`` is what lets the ``teams`` read authorize via ``can()``
# (pure grant) instead of org membership — the org's team directory is read by
# the workers who pick teams on notes/tasks.  Only the teams permission rides
# the Role today; the rest of the caseworker bundle (notes/tasks/clients)
# stays legacy until RFC 0003 role-backs it.
CASEWORKER_ROLE = RoleDef(
    name=CASEWORKER.name,
    permissions=[Team.perms.VIEW],
    is_invitable=CASEWORKER.is_invitable,
)
