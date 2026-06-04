from clients.models import ClientProfile
from common.permissions.config import TemplateConfig
from notes.models import Note, ServiceRequest

CASEWORKER = TemplateConfig(
    name="Caseworker",
    permissions=[
        Note.perms.ADD,
        Note.perms.CHANGE,
        Note.perms.DELETE,
        Note.perms.VIEW,
        ServiceRequest.perms.ADD,
        ServiceRequest.perms.CHANGE,
        ServiceRequest.perms.DELETE,
        ServiceRequest.perms.VIEW,
        ClientProfile.perms.ADD,
        ClientProfile.perms.CHANGE,
        ClientProfile.perms.DELETE,
        ClientProfile.perms.VIEW,
    ],
)
