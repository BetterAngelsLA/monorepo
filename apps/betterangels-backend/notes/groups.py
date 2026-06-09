from clients.models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    HmisProfile,
    SocialMediaProfile,
)
from common.models import Attachment
from common.permissions.config import TemplateConfig
from notes.models import Note, ServiceRequest
from shelters.models.shelter import Shelter
from tasks.models import Task

CASEWORKER = TemplateConfig(
    name="Caseworker",
    permissions=[
        # Note: ADD + VIEW (CHANGE and DELETE granted per-object at creation)
        Note.perms.ADD,
        Note.perms.VIEW,
        # ServiceRequest: ADD + VIEW (CHANGE and DELETE granted per-object at creation)
        ServiceRequest.perms.ADD,
        ServiceRequest.perms.VIEW,
        # Client models: ADD + VIEW (CHANGE and DELETE granted per-object at creation)
        ClientProfile.perms.ADD,
        ClientProfile.perms.VIEW,
        ClientContact.perms.ADD,
        ClientContact.perms.VIEW,
        ClientHouseholdMember.perms.ADD,
        ClientHouseholdMember.perms.VIEW,
        HmisProfile.perms.ADD,
        HmisProfile.perms.VIEW,
        SocialMediaProfile.perms.ADD,
        SocialMediaProfile.perms.VIEW,
        # Task: ADD + VIEW
        Task.perms.ADD,
        Task.perms.VIEW,
        # Attachment: ADD + VIEW
        Attachment.perms.ADD,
        Attachment.perms.VIEW,
        # Custom perms
        Shelter.perms.VIEW_PRIVATE,
    ],
)
