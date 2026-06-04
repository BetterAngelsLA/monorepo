from common.permissions.config import TemplateConfig
from shelters.models.reservation import Reservation
from shelters.models.shelter import Bed, Room, Shelter

SHELTER_OPERATOR = TemplateConfig(
    name="Shelter Operator",
    permissions=[
        Shelter.perms.ADD,
        Shelter.perms.CHANGE,
        Shelter.perms.DELETE,
        Shelter.perms.VIEW,
        Bed.perms.ADD,
        Bed.perms.CHANGE,
        Bed.perms.DELETE,
        Bed.perms.VIEW,
        Room.perms.ADD,
        Room.perms.CHANGE,
        Room.perms.DELETE,
        Room.perms.VIEW,
        Reservation.perms.ADD,
        Reservation.perms.CHANGE,
        Reservation.perms.DELETE,
        Reservation.perms.VIEW,
    ],
)
