from typing import Optional

import strawberry_django
from accounts.types import UserType
from clients.types import ClientProfileType
from referrals.enums import ReferralStatusEnum
from shelters.types import ShelterType
from strawberry import ID, auto

from . import models


@strawberry_django.filter_type(models.Referral, lookups=True)
class ReferralFilter:
    client_profile: Optional[ID]
    created_by: Optional[ID]
    status: Optional[ReferralStatusEnum]


@strawberry_django.order_type(models.Referral, one_of=False)
class ReferralOrder:
    id: auto
    created_at: auto
    updated_at: auto
    status: auto


@strawberry_django.type(models.Referral, pagination=True, filters=ReferralFilter, ordering=ReferralOrder)
class ReferralType:
    id: ID
    client_profile: Optional[ClientProfileType]
    shelter: Optional[ShelterType]
    created_at: auto
    created_by: Optional[UserType]
    status: Optional[ReferralStatusEnum]
    notes: auto
    updated_at: auto


@strawberry_django.input(models.Referral)
class CreateReferralInput:
    client_profile: ID
    shelter: ID
    notes: Optional[str]
    # The acting org (RFC 0003): authority is ``require_can`` at this org and the
    # created row's ``organization``.  REQUIRED, and unavoidably so: legacy
    # referrals carried CHANGE/DELETE as per-record guardian rows and never a
    # ``CASEWORKER`` ``PermissionGroup``, so there is no legacy arm left to fall
    # back on for a build that omits this field — unlike tasks/notes, no tolerant
    # middle phase exists.  Gated on app adoption; see the PR checklist.
    organization_id: ID


@strawberry_django.input(models.Referral, partial=True)
class UpdateReferralInput:
    id: ID
    status: Optional[ReferralStatusEnum]
    notes: Optional[str]
