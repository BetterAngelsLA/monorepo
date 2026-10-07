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
        # Task: ADD + VIEW; CHANGE/DELETE ride the org-scoped Role (RFC 0003
        # slice 1) and are listed here so the template stays the Role's superset.
        Task.perms.ADD,
        Task.perms.VIEW,
        Task.perms.CHANGE,
        Task.perms.DELETE,
        # Attachment: ADD + VIEW
        Attachment.perms.ADD,
        Attachment.perms.VIEW,
        # Teams: VIEW only (role-backed below).
        Team.perms.VIEW,
    ],
    invite_html="account/email/email_invite_organization.html",
    invite_txt="account/messages/email_invite_organization.txt",
)


# ── Role definition (ADR 0001 §2.2 — caseworker teams-read slice) ────────
# The scoped ``Caseworker`` Role backs the cut-over slices of the caseworker
# template.  Teams read shipped first (``teams.view_team``); the clients
# cutover (ADR 0001 §5.1, RFC 0002) adds the client family — grant-only now
# (SHARED read / SHARED write); the Task slice (RFC 0003) rides next.  Notes
# and referrals stay legacy until their own slices.
CASEWORKER_ROLE = RoleDef(
    name=CASEWORKER.name,
    permissions=[
        Team.perms.VIEW,
        # Task slice — RFC 0003 slice 1: org-scoped writes via ``can_obj``,
        # reads SHARED (the ``can_anywhere`` checker).
        Task.perms.ADD,
        Task.perms.VIEW,
        Task.perms.CHANGE,
        Task.perms.DELETE,
        # Client family — the RFC 0002 cutover bundle.
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
    ],
    is_invitable=CASEWORKER.is_invitable,
)
