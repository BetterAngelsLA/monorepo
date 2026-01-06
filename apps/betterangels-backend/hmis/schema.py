from typing import Any, Iterable, cast

import strawberry
import strawberry_django
from accounts.types import UserType
from accounts.utils import get_user_permission_group
from betterangels_backend import settings
from common.models import Location, PhoneNumber
from django.contrib.auth import get_user_model
from django.contrib.auth import login as django_login
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from hmis.models import HmisClientProfile, HmisNote
from notes.enums import ServiceRequestStatusEnum, ServiceRequestTypeEnum
from notes.models import ServiceRequest
from notes.types import ServiceRequestType
from notes.utils.note_utils import get_service_args
from strawberry import ID, asdict
from strawberry.permission import BasePermission
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated

from .api_bridge import HmisApiBridge
from .types import (
    CreateHmisClientProfileInput,
    CreateHmisNoteInput,
    CreateHmisNoteServiceRequestInput,
    HmisClientProfileType,
    HmisClientProgramType,
    HmisLoginError,
    HmisLoginResult,
    HmisNoteType,
    HmisProgramType,
    ProgramEnrollmentType,
    RemoveHmisNoteServiceRequestInput,
    UpdateHmisClientProfileInput,
    UpdateHmisNoteInput,
    UpdateHmisNoteLocationInput,
)

User = get_user_model()


class IsHmisUser(BasePermission):
    message: str = "You do not have access to this resource."

    def has_permission(self, source: Any, info: Info, **kwargs: Any) -> bool:
        user = get_current_user(info)

        return user.is_authenticated and user.groups.filter(name="Hmis User").exists()  # type: ignore


def _get_client_program(program_data: dict[str, Any]) -> HmisClientProgramType:
    return HmisClientProgramType(id=program_data["id"], program=HmisProgramType(**program_data["program"]))


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsHmisUser])
    def hmis_client_profile(self, info: Info, id: ID) -> HmisClientProfileType:
        try:
            hmis_client_profile = HmisClientProfile.objects.get(pk=id)
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        if not hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        hmis_api_bridge = HmisApiBridge(info=info)
        client_data = hmis_api_bridge.get_client(hmis_client_profile.hmis_id)

        client_data.pop("unique_identifier")
        client_data.pop("hmis_id")

        hmis_client_profile = resolvers.update(info, hmis_client_profile, {**client_data})

        return cast(HmisClientProfileType, hmis_client_profile)

    hmis_client_profiles: OffsetPaginated[HmisClientProfileType] = strawberry_django.offset_paginated(
        permission_classes=[IsHmisUser],
    )

    @strawberry_django.field(permission_classes=[IsHmisUser])
    def hmis_note(self, info: Info, id: ID) -> HmisNoteType:
        try:
            hmis_note = HmisNote.objects.get(pk=id)
        except HmisNote.DoesNotExist:
            raise ObjectDoesNotExist(f"Note matching ID {id} could not be found.")

        if not hmis_note.hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        hmis_api_bridge = HmisApiBridge(info=info)

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

    hmis_notes: OffsetPaginated[HmisNoteType] = strawberry_django.offset_paginated(permission_classes=[IsHmisUser])

    @strawberry.field()
    def hmis_client_programs(
        self,
        info: Info,
        client_id: ID,
    ) -> list[HmisClientProgramType]:
        try:
            client_hmis_id = HmisClientProfile.objects.get(pk=client_id).hmis_id
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        if not client_hmis_id:
            raise ValidationError("Missing Client hmis_id")

        hmis_api_bridge = HmisApiBridge(info=info)

        client_programs = hmis_api_bridge.get_client_programs(client_hmis_id=client_hmis_id)

        return [_get_client_program(p) for p in client_programs["items"]]


@strawberry.type
class Mutation:
    @strawberry.mutation
    def hmis_login(self, info: Info, email: str, password: str) -> HmisLoginResult:
        request = info.context["request"]
        hmis_api_bridge = HmisApiBridge(info=info)
        hmis_api_bridge.create_auth_token(email, password)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return HmisLoginError(message="Invalid credentials or HMIS login failed")

        default_group = Group.objects.get(name="Hmis User")
        user.groups.add(default_group)

        backend = settings.AUTHENTICATION_BACKENDS[0]
        django_login(request, user, backend=backend)

        return cast(UserType, user)

    @strawberry_django.mutation(permission_classes=[IsHmisUser])
    def create_hmis_client_profile(self, info: Info, data: CreateHmisClientProfileInput) -> HmisClientProfileType:
        hmis_api_bridge = HmisApiBridge(info=info)

        client_data = hmis_api_bridge.create_client(data)
        current_user = get_current_user(info)

        hmis_client_profile = resolvers.create(
            info,
            HmisClientProfile,
            {
                **client_data,
                "alias": data.alias,
                "created_by": current_user,
            },
        )

        if not hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        hmis_api_bridge.create_client_program(client_hmis_id=hmis_client_profile.hmis_id)

        return cast(HmisClientProfileType, hmis_client_profile)

    @strawberry_django.mutation(permission_classes=[IsHmisUser])
    def update_hmis_client_profile(self, info: Info, data: UpdateHmisClientProfileInput) -> HmisClientProfileType:
        try:
            hmis_client_profile = HmisClientProfile.objects.get(pk=data.id)
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        hmis_api_bridge = HmisApiBridge(info=info)

        data_dict = strawberry.asdict(data)
        phone_numbers = data_dict.pop("phone_numbers", []) or []
        assert isinstance(phone_numbers, Iterable)

        data_dict["hmis_id"] = hmis_client_profile.hmis_id

        client_data = hmis_api_bridge.update_client(data_dict)
        client_data.pop("hmis_id")

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

    @strawberry_django.mutation(permission_classes=[IsHmisUser])
    def create_hmis_note(self, info: Info, data: CreateHmisNoteInput) -> HmisNoteType:
        try:
            hmis_client_profile = HmisClientProfile.objects.get(pk=data.hmis_client_profile_id)
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        if not hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        hmis_api_bridge = HmisApiBridge(info=info)

        note_data = hmis_api_bridge.create_note(client_hmis_id=hmis_client_profile.hmis_id, data=data)
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

    @strawberry_django.mutation(permission_classes=[IsHmisUser])
    def update_hmis_note(self, info: Info, data: UpdateHmisNoteInput) -> HmisNoteType:
        try:
            hmis_note = HmisNote.objects.get(pk=data.id)
        except HmisNote.DoesNotExist:
            raise ObjectDoesNotExist(f"Note matching ID {id} could not be found.")

        hmis_api_bridge = HmisApiBridge(info=info)

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

    @strawberry_django.mutation(permission_classes=[IsHmisUser])
    def create_hmis_client_program(self, info: Info, client_id: int, program_hmis_id: int) -> ProgramEnrollmentType:
        try:
            hmis_client_profile = HmisClientProfile.objects.get(pk=client_id)
        except HmisClientProfile.DoesNotExist:
            raise ObjectDoesNotExist(f"Client Profile matching ID {id} could not be found.")

        if not hmis_client_profile.hmis_id:
            raise ValidationError("Missing Client hmis_id")

        hmis_api_bridge = HmisApiBridge(info=info)

        enrollment_data = hmis_api_bridge.create_client_program(
            client_hmis_id=hmis_client_profile.hmis_id,
            program_hmis_id=program_hmis_id,
        )

        return ProgramEnrollmentType(
            id=enrollment_data["id"],
            client_id=enrollment_data["ref_client"],
            ref_client_program=enrollment_data["ref_program"],
        )

    @strawberry_django.mutation(permission_classes=[IsHmisUser])
    def update_hmis_note_location(self, info: Info, data: UpdateHmisNoteLocationInput) -> HmisNoteType:
        with transaction.atomic():
            hmis_note = HmisNote.objects.get(id=data.id)

            location_data: dict = strawberry.asdict(data)
            location = Location.get_or_create_location(location_data["location"])
            hmis_note = resolvers.update(
                info,
                hmis_note,
                {"location": location},
            )

            return cast(HmisNoteType, hmis_note)

    @strawberry_django.mutation(permission_classes=[IsHmisUser])
    def create_hmis_note_service_request(
        self, info: Info, data: CreateHmisNoteServiceRequestInput
    ) -> ServiceRequestType:
        with transaction.atomic():
            user = get_current_user(info)
            permission_group = get_user_permission_group(user)

            service_request_data = asdict(data)
            service_request_type = str(service_request_data.pop("service_request_type"))
            hmis_note_id = str(service_request_data.pop("hmis_note_id"))
            hmis_note = HmisNote.objects.get(pk=hmis_note_id)

            service_args = get_service_args(service_request_data, permission_group.organization)

            service_request = resolvers.create(
                info,
                ServiceRequest,
                {
                    **service_request_data,
                    **service_args,
                    "status": (
                        ServiceRequestStatusEnum.TO_DO
                        if service_request_type == ServiceRequestTypeEnum.REQUESTED
                        else ServiceRequestStatusEnum.COMPLETED
                    ),
                    "hmis_client_profile": hmis_note.hmis_client_profile,
                    "created_by": user,
                },
            )

            if service_request_type == ServiceRequestTypeEnum.PROVIDED:
                hmis_note.provided_services.add(service_request)
            elif service_request_type == ServiceRequestTypeEnum.REQUESTED:
                hmis_note.requested_services.add(service_request)
            else:
                raise NotImplementedError

            return cast(ServiceRequestType, service_request)

    @strawberry_django.mutation(permission_classes=[IsHmisUser])
    def remove_hmis_note_service_request(self, info: Info, data: RemoveHmisNoteServiceRequestInput) -> HmisNoteType:
        with transaction.atomic():
            hmis_note = HmisNote.objects.get(pk=data.hmis_note_id)

            service_request = ServiceRequest.objects.get(id=data.service_request_id)

            if data.service_request_type == ServiceRequestTypeEnum.REQUESTED:
                hmis_note.requested_services.remove(service_request)
            elif data.service_request_type == ServiceRequestTypeEnum.PROVIDED:
                hmis_note.provided_services.remove(service_request)
            else:
                raise NotImplementedError

            return cast(HmisNoteType, hmis_note)
