from typing import Iterable, cast

import strawberry
import strawberry_django
from common.models import PhoneNumber
from common.permissions.utils import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from hmis.models import HmisClientProfile, HmisNote
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated

from .rest_api_bridge import HmisRestApiBridge
from .types import (
    CreateHmisClientProfileInput,
    CreateHmisNoteInput,
    HmisClientProfileType,
    HmisNoteType,
    UpdateHmisClientProfileInput,
    UpdateHmisNoteInput,
)


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def hmis_client_profile(self, info: Info, hmis_id: str) -> HmisClientProfileType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        client_data = hmis_api_bridge.get_client(hmis_id)

        unique_identifier = client_data.pop("unique_identifier")
        returned_hmis_id = str(client_data.pop("hmis_id"))

        if hmis_id != returned_hmis_id:
            raise ValidationError("Client ID mismatch")

        hmis_client_profile, _ = HmisClientProfile.objects.filter(hmis_id=hmis_id).update_or_create(
            hmis_id=hmis_id,
            unique_identifier=unique_identifier,
            defaults={**client_data},
        )

        return cast(HmisClientProfileType, hmis_client_profile)

    hmis_client_profiles: OffsetPaginated[HmisClientProfileType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
    )

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def hmis_note(self, info: Info, client_hmis_id: str, note_hmis_id: str) -> HmisNoteType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        note_data = hmis_api_bridge.get_note(client_hmis_id, note_hmis_id)

        returned_hmis_id = str(note_data.pop("hmis_id"))

        try:
            hmis_client_profile_id = HmisClientProfile.objects.get(hmis_id=client_hmis_id).pk

        except HmisClientProfile.DoesNotExist:
            raise ValidationError("Client does not exist")

        if note_hmis_id != returned_hmis_id:
            raise ValidationError("Note ID mismatch")

        hmis_note, _ = HmisNote.objects.filter(
            hmis_id=note_hmis_id,
            hmis_client_profile_id=hmis_client_profile_id,
        ).update_or_create(
            hmis_id=note_hmis_id,
            hmis_client_profile_id=hmis_client_profile_id,
            defaults={**note_data},
        )

        return cast(HmisNoteType, hmis_note)

    hmis_notes: OffsetPaginated[HmisNoteType] = strawberry_django.offset_paginated(permission_classes=[IsAuthenticated])


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_hmis_client_profile(self, info: Info, data: CreateHmisClientProfileInput) -> HmisClientProfileType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        client_data = hmis_api_bridge.create_client(data)
        current_user = get_current_user(info)

        hmis_client_profile = resolvers.create(info, HmisClientProfile, {**client_data, "created_by": current_user})

        return cast(HmisClientProfileType, hmis_client_profile)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_hmis_client_profile(self, info: Info, data: UpdateHmisClientProfileInput) -> HmisClientProfileType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        data_dict = strawberry.asdict(data)
        phone_numbers = data_dict.pop("phone_numbers", []) or []
        assert isinstance(phone_numbers, Iterable)

        client_data = hmis_api_bridge.update_client(data_dict)

        hmis_id = client_data.pop("hmis_id")
        client_data.pop("alias")  # TODO: API currently returning null for `alias`. Remove this once fixed.

        hmis_client_profile = HmisClientProfile.objects.get(hmis_id=hmis_id)

        content_type = ContentType.objects.get_for_model(HmisClientProfile)
        for phone_number in phone_numbers:
            PhoneNumber.objects.create(
                content_type=content_type,
                object_id=hmis_client_profile.id,
                number=phone_number["number"],
                is_primary=phone_number["is_primary"],
            )

        hmis_client_profile = resolvers.update(info, hmis_client_profile, {**data_dict, **client_data})

        return cast(HmisClientProfileType, hmis_client_profile)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_hmis_note(self, info: Info, data: CreateHmisNoteInput) -> HmisNoteType:
        client_id = data.hmis_client_profile_id

        hmis_client_profile = HmisClientProfile.objects.get(pk=client_id)

        if str(hmis_client_profile.hmis_id) != data.client_hmis_id:
            raise ValidationError("Client ID mismatch")

        hmis_api_bridge = HmisRestApiBridge(info=info)

        note_data = hmis_api_bridge.create_note(data)
        current_user = get_current_user(info)

        hmis_note = resolvers.create(info, HmisNote, {**note_data, "created_by": current_user})

        return cast(HmisNoteType, hmis_note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_hmis_note(self, info: Info, data: UpdateHmisNoteInput) -> HmisNoteType:
        client_id = data.hmis_client_profile_id

        hmis_client_profile = HmisClientProfile.objects.get(pk=client_id)

        if str(hmis_client_profile.hmis_id) != data.client_hmis_id:
            raise ValidationError("Client ID mismatch")

        hmis_api_bridge = HmisRestApiBridge(info=info)

        note_data = hmis_api_bridge.update_note(data)

        hmis_note = HmisNote.objects.get(hmis_id=data.hmis_id)
        hmis_note = resolvers.update(info, hmis_note, {**note_data})

        return cast(HmisNoteType, hmis_note)
