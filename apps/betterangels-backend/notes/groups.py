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
from referrals.models import Referral
from teams.models import Team

CASEWORKER = TemplateConfig(
    name="Caseworker",
    permissions=[
        # Note: ADD + VIEW + CHANGE + DELETE.  The write cutover (RFC 0003
        # slice 2) removed the guardian write paths, so the model-level
        # CHANGE/DELETE perms can no longer over-permit through
        # ``filter_for_user`` — they now mirror the Role bundle.
        Note.perms.ADD,
        Note.perms.VIEW,
        Note.perms.CHANGE,
        Note.perms.DELETE,
        # ServiceRequest: ADD only.  SR writes gate through the owning note's
        # org (SR is not org-scoped yet — its ``service`` hop cannot resolve);
        # the model-level VIEW/CHANGE/DELETE perms move with the
        # service-catalog cutover, mirroring the Role bundle.
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
        # Referral: full CRUD.  Legacy referrals carried CHANGE/DELETE as
        # per-record guardian rows written at creation, so the template never
        # listed them; the cutover (RFC 0003 §sub-decision 3) puts them on the
        # role, org-scoped, with the shelter hop as an extra read reach.
        Referral.perms.ADD,
        Referral.perms.VIEW,
        Referral.perms.CHANGE,
        Referral.perms.DELETE,
    ],
    invite_html="account/email/email_invite_organization.html",
    invite_txt="account/messages/email_invite_organization.txt",
)


# ── Role definition (ADR 0001 §2.2 — caseworker teams-read slice) ────────
# The scoped ``Caseworker`` Role backs the cut-over slices of the caseworker
# template.  Teams read shipped first (``teams.view_team``); the clients
# cutover (ADR 0001 §5.1, RFC 0002) adds the client family — grant-only now
# (SHARED read / SHARED write); the Task slice (RFC 0003 slice 1) and the
# Note slice (slice 2) and the referral slice ride next.
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
        # Note slice — RFC 0003 slice 2: org-scoped writes via ``can_obj``,
        # reads SHARED.  Attachments ride the note gate (the upload mutations
        # gate on Note CHANGE), so the scoped role carries no Attachment perms
        # — E005 rejects them (Attachment declares no org scoping).
        Note.perms.ADD,
        Note.perms.VIEW,
        Note.perms.CHANGE,
        Note.perms.DELETE,
        # ServiceRequest: deliberately absent from the scoped role — SR is not
        # org-scoped in this slice (its ``service`` hop cannot resolve until
        # OrganizationService is org-scoped), and E005 forbids a scoped Role
        # carrying perms on an undeclared model.  The SR gates ride the owning
        # note's org instead; the perms return with the service-catalog cutover.
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
        # Referral slice — RFC 0003 §sub-decision 3: reach is "own org or via
        # the shelter", which ``own_org_or`` expresses.  CHANGE/DELETE ride the
        # org role; a foreign referral seen through the shared read rule fails
        # closed in ``can_obj``.
        Referral.perms.ADD,
        Referral.perms.VIEW,
        Referral.perms.CHANGE,
        Referral.perms.DELETE,
    ],
    is_invitable=CASEWORKER.is_invitable,
)
