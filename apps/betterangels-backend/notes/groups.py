from clients.models import ClientProfile
from notes.models import Note, ServiceRequest

CASEWORKER = "Caseworker"

CASEWORKER_PERMISSIONS = [
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
]
