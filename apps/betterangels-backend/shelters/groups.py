from clients.models import ClientProfile
from common.permissions.config import TemplateConfig

from shelters.models.reservation import Reservation
from shelters.models.shelter import Bed, Room, Shelter

SHELTER_OPERATOR = TemplateConfig(
    name="Shelter Operator",
    permissions=[
        # Shelter: full CRUD
        Shelter.perms.ADD,
        Shelter.perms.CHANGE,
        Shelter.perms.DELETE,
        Shelter.perms.VIEW,
        # Bed: full CRUD
        Bed.perms.ADD,
        Bed.perms.CHANGE,
        Bed.perms.DELETE,
        Bed.perms.VIEW,
        # Room: full CRUD
        Room.perms.ADD,
        Room.perms.CHANGE,
        Room.perms.DELETE,
        Room.perms.VIEW,
        # Reservation: full CRUD
        Reservation.perms.ADD,
        Reservation.perms.CHANGE,
        Reservation.perms.DELETE,
        Reservation.perms.VIEW,
        # Custom perms
        Shelter.perms.VIEW_PRIVATE,
        ClientProfile.perms.VIEW,
    ],
    invite_html="account/email/shelter_operator_invite.html",
    invite_txt="account/messages/shelter_operator_invite.txt",
    welcome_html="shelters/email/shelter_operator_welcome.html",
    welcome_txt="shelters/email/shelter_operator_welcome.txt",
    base_url_setting="SHELTER_WEB_BASE_URL",
)
