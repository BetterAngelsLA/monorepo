from typing import Optional

import strawberry
import strawberry_django
from accounts.types import UserType
from clients.types import ClientProfileType
from referrals.enums import ReferralStatusEnum
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
    shelter: auto
    created_at: auto
    created_by: Optional[UserType]
    status: Optional[ReferralStatusEnum]
    notes: auto
    updated_at: auto


@strawberry_django.input(models.Referral, partial=True)
class CreateReferralInput:
    client_profile: ID
    shelter: ID
    notes: Optional[str]


@strawberry_django.input(models.Referral, partial=True)
class UpdateReferralInput:
    id: ID
    status: Optional[ReferralStatusEnum]
    notes: Optional[str]
