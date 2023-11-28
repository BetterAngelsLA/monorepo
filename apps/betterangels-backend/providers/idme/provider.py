from enum import Enum
from typing import Any, List

from allauth.account.models import EmailAddress
from allauth.socialaccount import providers
from allauth.socialaccount.providers.base import ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider


class Scope(Enum):
    MILITARY = "military"
    VETERAN = "veteran"
    STUDENT = "student"
    RESIDENT = "resident"
    GOVERNMENT = "government"
    TEACHER = "teacher"
    FIRST_RESPONDER = "first_responder"
    NURSE = "nurse"
    DOCTOR = "doctor"
    NONPROFIT = "nonprofit"


class IdmeAccount(ProviderAccount):
    pass


class IdmeProvider(OAuth2Provider):
    id = "idme"
    name = "id.me"
    account_class = IdmeAccount

    def get_default_scope(self) -> List[Scope]:
        scope = [Scope.NONPROFIT]
        return scope

    def extract_uid(self, data: dict[str, str]) -> str:
        return str(data["id"])

    def extract_common_fields(self, data: Any) -> dict[str, str]:
        return dict(
            email=data.get("email"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            name=data.get("name"),
        )

    def extract_email_addresses(self, data: Any) -> List[EmailAddress]:
        ret = []
        email = data.get("email")
        if email:
            ret.append(EmailAddress(email=email, verified=True, primary=True))
        return ret


providers.registry.register(IdmeProvider)
