import datetime
from typing import Any, Iterable, cast

import strawberry
import strawberry_django
from clients.permissions import ClientProfilePermissions
from common.models import PhoneNumber
from common.permissions.utils import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from hmis.models import HmisClientProfile
from strawberry.types import Info
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasRetvalPerm

from .api_bridge import EXCLUDED_BA_FIELDS, HmisApiRestBridge
from .types import (
    CreateHmisClientProfileInput,
    HmisClientProfileType,
    UpdateHmisClientProfileInput,
)

DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"


def _format_timestamp_fields(client_data: dict[str, Any]) -> dict[str, Any]:
    return {
        **client_data,
        "added_date": datetime.datetime.strptime(client_data.pop("added_date"), DATETIME_FORMAT),
        "last_updated": datetime.datetime.strptime(client_data.pop("last_updated"), DATETIME_FORMAT),
    }


@strawberry.type
class Query:
    @strawberry_django.field(
        permission_classes=[IsAuthenticated], extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])]
    )
    def hmis_client_profile(self, info: Info, hmis_id: str) -> HmisClientProfileType:
        hmis_api_bridge = HmisApiRestBridge(info=info)

        client_data = hmis_api_bridge.get_client(hmis_id)

        birth_date = (
            datetime.date.fromisoformat(client_data.pop("birth_date")) if client_data.get("birth_date") else None
        )
        screen_values = {**client_data.pop("screen_values", {})}
        cleaned_client_data = _format_timestamp_fields(client_data)

        data = {
            **cleaned_client_data,
            **screen_values,
            "birth_date": birth_date,
        }

        hmis_id = data.pop("id")
        unique_identifier = data.pop("unique_identifier")

        hmis_client_profile, _ = HmisClientProfile.objects.filter(hmis_id=hmis_id).update_or_create(
            hmis_id=hmis_id,
            unique_identifier=unique_identifier,
            defaults={**data},
        )

        return cast(HmisClientProfileType, hmis_client_profile)

    hmis_client_profiles: OffsetPaginated[HmisClientProfileType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
    )


@strawberry.type
class Mutation:
    @strawberry_django.mutation
    def create_hmis_client_profile(self, info: Info, data: CreateHmisClientProfileInput) -> HmisClientProfileType:
        hmis_api_bridge = HmisApiRestBridge(info=info)

        client_data = hmis_api_bridge.create_client(data)

        hmis_id = client_data.pop("id")
        screen_values = {**client_data.pop("screen_values", {})}
        cleaned_client_data = _format_timestamp_fields(client_data)

        data = {
            **cleaned_client_data,
            **screen_values,
            "hmis_id": hmis_id,
        }

        hmis_client_profile = resolvers.create(info, HmisClientProfile, {**data})

        return cast(HmisClientProfileType, hmis_client_profile)

    @strawberry_django.mutation
    def update_hmis_client_profile(self, info: Info, data: UpdateHmisClientProfileInput) -> HmisClientProfileType:
        hmis_api_bridge = HmisApiRestBridge(info=info)

        data_dict = strawberry.asdict(data)
        phone_numbers = data_dict.pop("phone_numbers", []) or []
        assert isinstance(phone_numbers, Iterable)

        hmis_dict = {k: v for k, v in data_dict.items() if k not in EXCLUDED_BA_FIELDS}

        client_data = hmis_api_bridge.update_client(hmis_dict)

        hmis_id = client_data.pop("id")
        client_data.pop("alias")  # TODO: API currently returning null for `alias`. Remove this once fixed.
        cleaned_client_data = _format_timestamp_fields(client_data)
        screen_values = {**cleaned_client_data.pop("screen_values", {})}

        update_data = {**data_dict, **cleaned_client_data, **screen_values}

        hmis_client_profile = HmisClientProfile.objects.get(hmis_id=hmis_id)

        content_type = ContentType.objects.get_for_model(HmisClientProfile)
        for phone_number in phone_numbers:
            PhoneNumber.objects.create(
                content_type=content_type,
                object_id=hmis_client_profile.id,
                number=phone_number["number"],
                is_primary=phone_number["is_primary"],
            )

        hmis_client_profile = resolvers.update(info, hmis_client_profile, {**update_data})

        return cast(HmisClientProfileType, hmis_client_profile)
