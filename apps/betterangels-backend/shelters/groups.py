from common.permissions.config import TemplateConfig
from shelters.models.reservation import Reservation
from shelters.models.shelter import Bed, Room, Shelter

SHELTER_OPERATOR = TemplateConfig(
    name="Shelter Operator",
    permissions=[
        # ADD only — CHANGE, DELETE, and VIEW granted per-object at creation
        Shelter.perms.ADD,
        Bed.perms.ADD,
        Room.perms.ADD,
        Reservation.perms.ADD,
        # Custom perms
        Shelter.perms.VIEW_PRIVATE,
    ],
    invite_html="account/email/shelter_operator_invite.html",
    invite_txt="account/messages/shelter_operator_invite.txt",
)
