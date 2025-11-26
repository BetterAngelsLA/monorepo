from typing import Any, Iterable, cast

import strawberry
import strawberry_django
from common.models import PhoneNumber
from common.permissions.utils import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from hmis.models import HmisClientProfile, HmisNote
from strawberry import ID
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated

from .rest_api_bridge import HmisRestApiBridge
from .types import (
    CreateHmisClientProfileInput,
    CreateHmisNoteInput,
    HmisClientProfileType,
    HmisClientProgramType,
    HmisNoteType,
    HmisProgramType,
    ProgramEnrollmentType,
    UpdateHmisClientProfileInput,
    UpdateHmisNoteInput,
)


def _get_client_program(program_data: dict[str, Any]) -> HmisClientProgramType:
    return HmisClientProgramType(id=program_data["id"], program=HmisProgramType(**program_data["program"]))


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def hmis_client_profile(self, info: Info, id: ID) -> HmisClientProfileType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        try:
            hmis_client_profile = HmisClientProfile.objects.get(pk=id)
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        if not hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        client_data = hmis_api_bridge.get_client(hmis_client_profile.hmis_id)

        client_data.pop("unique_identifier")
        client_data.pop("hmis_id")

        hmis_client_profile = resolvers.update(info, hmis_client_profile, {**client_data})

        return cast(HmisClientProfileType, hmis_client_profile)

    hmis_client_profiles: OffsetPaginated[HmisClientProfileType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
    )

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def hmis_note(self, info: Info, id: ID) -> HmisNoteType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        try:
            hmis_note = HmisNote.objects.get(pk=id)
        except HmisNote.DoesNotExist:
            raise ObjectDoesNotExist(f"Note matching ID {id} could not be found.")

        if not hmis_note.hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        note_data = hmis_api_bridge.get_note(
            client_hmis_id=hmis_note.hmis_client_profile.hmis_id,
            note_hmis_id=hmis_note.hmis_id,
        )

        client_program = (
            _get_client_program(program_data) if (program_data := note_data.pop("client_program", None)) else None
        )

        hmis_note = resolvers.update(info, hmis_note, {**note_data})

        hmis_note.client_program = client_program  # type: ignore

        return cast(HmisNoteType, hmis_note)

    hmis_notes: OffsetPaginated[HmisNoteType] = strawberry_django.offset_paginated(permission_classes=[IsAuthenticated])

    @strawberry.field()
    def hmis_client_programs(
        self,
        info: Info,
        client_id: ID,
    ) -> list[HmisClientProgramType]:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        try:
            client_hmis_id = HmisClientProfile.objects.get(pk=client_id).hmis_id
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        if not client_hmis_id:
            raise ValidationError("Missing Client hmis_id")

        client_programs = hmis_api_bridge.get_client_programs(client_hmis_id=client_hmis_id)

        return [_get_client_program(p) for p in client_programs["items"]]


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_hmis_client_profile(self, info: Info, data: CreateHmisClientProfileInput) -> HmisClientProfileType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        client_data = hmis_api_bridge.create_client(data)
        current_user = get_current_user(info)

        hmis_client_profile = resolvers.create(info, HmisClientProfile, {**client_data, "created_by": current_user})

        if not hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        hmis_api_bridge.create_client_program(client_hmis_id=hmis_client_profile.hmis_id)

        return cast(HmisClientProfileType, hmis_client_profile)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_hmis_client_profile(self, info: Info, data: UpdateHmisClientProfileInput) -> HmisClientProfileType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        try:
            hmis_client_profile = HmisClientProfile.objects.get(pk=data.id)
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        data_dict = strawberry.asdict(data)
        phone_numbers = data_dict.pop("phone_numbers", []) or []
        assert isinstance(phone_numbers, Iterable)

        data_dict["hmis_id"] = hmis_client_profile.hmis_id

        client_data = hmis_api_bridge.update_client(data_dict)
        client_data.pop("hmis_id")
        client_data.pop("alias")  # TODO: API currently returning null for `alias`. Remove this once fixed.

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
        try:
            hmis_client_profile = HmisClientProfile.objects.get(pk=data.hmis_client_profile_id)
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        hmis_api_bridge = HmisRestApiBridge(info=info)

        note_data = hmis_api_bridge.create_note(client_hmis_id=hmis_client_profile.pk, data=data)
        current_user = get_current_user(info)

        client_program = (
            _get_client_program(program_data) if (program_data := note_data.pop("client_program", None)) else None
        )

        hmis_note = resolvers.create(
            info,
            HmisNote,
            {
                **note_data,
                "created_by": current_user,
                "hmis_client_profile": hmis_client_profile,
            },
        )

        hmis_note.client_program = client_program  # type: ignore

        return cast(HmisNoteType, hmis_note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_hmis_note(self, info: Info, data: UpdateHmisNoteInput) -> HmisNoteType:
        try:
            hmis_note = HmisNote.objects.get(pk=data.id)
        except HmisNote.DoesNotExist:
            raise ObjectDoesNotExist(f"Note matching ID {id} could not be found.")

        hmis_api_bridge = HmisRestApiBridge(info=info)

        if not hmis_note.hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        note_data = hmis_api_bridge.update_note(
            client_hmis_id=hmis_note.hmis_client_profile.hmis_id,
            note_hmis_id=hmis_note.hmis_id,
            data=data,
        )

        client_program = (
            _get_client_program(program_data) if (program_data := note_data.pop("client_program", None)) else None
        )

        hmis_note = resolvers.update(info, hmis_note, {**note_data})

        hmis_note.client_program = client_program  # type: ignore

        return cast(HmisNoteType, hmis_note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_hmis_client_program(self, info: Info, client_id: int, program_hmis_id: int) -> ProgramEnrollmentType:
        hmis_api_bridge = HmisRestApiBridge(info=info)

        try:
            hmis_client_profile = HmisClientProfile.objects.get(pk=client_id)
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        if not hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        enrollment_data = hmis_api_bridge.create_client_program(
            client_hmis_id=hmis_client_profile.hmis_id,
            program_hmis_id=program_hmis_id,
        )

        return ProgramEnrollmentType(
            id=enrollment_data["id"],
            client_id=enrollment_data["ref_client"],
            ref_client_program=enrollment_data["ref_program"],
        )
