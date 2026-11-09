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
from notes.permissions import PrivateDetailsPermissions
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

# The note bundle (RFC 0003 slice 2), shared by the legacy template and the
# scoped Role so the template stays the Role's superset by construction.
# Private details ride it: the note object arm is not wired yet, so the only
# scoped lever is the org-wide one, and a Role without it would see nothing.
NOTE_PERMS = [
    Note.perms.ADD,
    Note.perms.VIEW,
    Note.perms.CHANGE,
    Note.perms.DELETE,
    PrivateDetailsPermissions.VIEW,
]

CASEWORKER = TemplateConfig(
    name="Caseworker",
    permissions=[
        # Note bundle.  The write cutover removed the guardian write paths, so
        # model-level CHANGE/DELETE can no longer over-permit through
        # ``filter_for_user`` — they mirror the Role bundle.
        *NOTE_PERMS,
        # ServiceRequest: ADD only.  SR writes gate through the owning note's
        # org (SR is not org-scoped yet — its ``service`` hop cannot resolve);
        # the model-level VIEW/CHANGE/DELETE perms move with the
        # service-catalog cutover, mirroring the Role bundle.
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
        # reads SHARED.  Attachments ride the note gate (the upload mutations
        # gate on Note CHANGE), so the scoped role carries no Attachment perms
        # — E005 rejects them (Attachment declares no org scoping).
        *NOTE_PERMS,
        # ServiceRequest: deliberately absent from the scoped role — SR is not
        # org-scoped in this slice (its ``service`` hop cannot resolve until
        # OrganizationService is org-scoped), and E005 forbids a scoped Role
        # carrying perms on an undeclared model.  The SR gates ride the owning
        # note's org instead; the perms return with the service-catalog cutover.
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
