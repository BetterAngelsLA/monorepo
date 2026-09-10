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

# The task bundle (RFC 0003 slice 1), shared by the legacy template and the
# scoped Role so the template stays the Role's superset by construction.
TASK_PERMS = [Task.perms.ADD, Task.perms.VIEW, Task.perms.CHANGE, Task.perms.DELETE]

CASEWORKER = TemplateConfig(
    name="Caseworker",
    permissions=[
        # Note: ADD + VIEW.  CHANGE/DELETE are deliberately NOT here yet: the
        # still-legacy write paths (guardian ``filter_for_user``) treat a
        # model-level perm as "all rows", so granting them before the write
        # cutover over-permits (RFC 0003 §Option A).  They move with the write
        # cutover; the Role below already carries the grant-side bundle.
        Note.perms.ADD,
        Note.perms.VIEW,
        # ServiceRequest: ADD only (VIEW, CHANGE, DELETE ride the Role grants;
        # the legacy model-level perms move with the write cutover).
        ServiceRequest.perms.ADD,
        # Client models: full CRUD
        *CLIENT_FAMILY_PERMS,
        *TASK_PERMS,
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
# RFC 0002 — SHARED read / SHARED write), referrals (RFC 0003), the task slice
# (RFC 0003 slice 1) and the note slice (RFC 0003 slice 2 — org-scoped writes,
# SHARED reads).
CASEWORKER_ROLE = RoleDef(
    name=CASEWORKER.name,
    permissions=[
        Team.perms.VIEW,
        # Task slice — RFC 0003 slice 1: org-scoped writes via ``can_obj``,
        # reads SHARED (the ``can_anywhere`` checker).
        *TASK_PERMS,
        # Note slice — RFC 0003 slice 2: org-scoped writes via ``can_obj``,
        # reads SHARED.  Attachments ride the note gate; the attachment perms
        # keep the upload checks passing for grant-only holders.
        Note.perms.ADD,
        Note.perms.VIEW,
        Note.perms.CHANGE,
        Note.perms.DELETE,
        ServiceRequest.perms.ADD,
        ServiceRequest.perms.VIEW,
        ServiceRequest.perms.CHANGE,
        ServiceRequest.perms.DELETE,
        Attachment.perms.ADD,
        Attachment.perms.VIEW,
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
