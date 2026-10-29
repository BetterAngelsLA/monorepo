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

# The client family's full-CRUD bundle, shared by the legacy template and the
# scoped Role so the two cannot drift apart while both exist (ADR 0001 §5.1).
# Order is per model, ADD/CHANGE/DELETE/VIEW, matching the previous hand lists.
CLIENT_FAMILY_PERMS = [
    perm
    for model in (ClientProfile, ClientContact, ClientHouseholdMember, HmisProfile, SocialMediaProfile)
    for perm in (model.perms.ADD, model.perms.CHANGE, model.perms.DELETE, model.perms.VIEW)
]

CASEWORKER = TemplateConfig(
    name="Caseworker",
    permissions=[
        # Note: ADD + VIEW only
        Note.perms.ADD,
        Note.perms.VIEW,
        # ServiceRequest: ADD only (VIEW, CHANGE, DELETE granted per-object at creation)
        ServiceRequest.perms.ADD,
        # Client models: full CRUD
        *CLIENT_FAMILY_PERMS,
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
# The scoped ``Caseworker`` Role backs the cut-over slices of the caseworker
# template: teams read (``teams.view_team``), the client family (ADR 0001 §5.1,
# RFC 0002 — SHARED read / SHARED write) and referrals (RFC 0003).  Notes/tasks
# stay legacy until their own cutover.
CASEWORKER_ROLE = RoleDef(
    name=CASEWORKER.name,
    permissions=[
        Team.perms.VIEW,
        # Client family — the RFC 0002 cutover bundle.
        *CLIENT_FAMILY_PERMS,
        # Referrals ride the same scoped Role (RFC 0003 / #2574).
        Referral.perms.ADD,
        Referral.perms.CHANGE,
        Referral.perms.VIEW,
        Referral.perms.DELETE,
    ],
    is_invitable=CASEWORKER.is_invitable,
)
