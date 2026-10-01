"""GraphQL surface for the object audit log (ADR 0004 §18)."""

from typing import List, cast

from accounts.models import User as AccountUser
from common.permissions.utils import IsAuthenticated
from shelters.models import Bed, Room, Reservation, Shelter
from shelters.selectors.operator import bed_get, reservation_get, room_get, shelter_get

import strawberry
from strawberry import ID, Info
from strawberry_django.auth.utils import get_current_user

from .selectors import object_audit_log
from .types import AuditActionType, AuditTargetType, to_action_type


def _resolve_target(user: AccountUser, target_type: AuditTargetType, object_id: ID) -> object:
    """Resolve the requested object with ``VIEW``, failing closed (§18).

    Every helper is reach-scoped by the caller's grants, so a cross-org or
    missing id raises ``ObjectDoesNotExist`` — indistinguishable, never leaked.
    """
    if target_type is AuditTargetType.SHELTER:
        return shelter_get(user=user, shelter_id=object_id, permission=Shelter.perms.VIEW)
    if target_type is AuditTargetType.ROOM:
        return room_get(user=user, room_id=object_id, permission=Room.perms.VIEW)
    if target_type is AuditTargetType.BED:
        return bed_get(user=user, bed_id=object_id, permission=Bed.perms.VIEW)
    return reservation_get(user=user, reservation_id=object_id, permission=Reservation.perms.VIEW)


@strawberry.type
class Query:
    @strawberry.field(permission_classes=[IsAuthenticated])
    def object_audit_log(
        self,
        info: Info,
        target_type: AuditTargetType,
        object_id: ID,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AuditActionType]:
        """The write audit log for one object, newest action first."""
        user = cast(AccountUser, get_current_user(info))
        obj = _resolve_target(user, target_type, object_id)
        actions = object_audit_log(obj=obj, target_type=target_type.value, limit=limit, offset=offset)
        return [to_action_type(action) for action in actions]
