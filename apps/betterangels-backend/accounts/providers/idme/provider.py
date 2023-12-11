from typing import Dict, List

from allauth.account.models import EmailAddress
from allauth.socialaccount.providers.base import ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider


class IdmeAccount(ProviderAccount):
    pass


class IdmeProvider(OAuth2Provider):
    id = "idme"
    name = "id.me"
    account_class = IdmeAccount

    def get_default_scope(self) -> List[str]:
        scope = ["fortified_identity"]
        return scope

    def extract_uid(self, data: Dict[str, List[Dict[str, str]]]) -> str:
        return next(
            (attr["value"] for attr in data["attributes"] if attr["handle"] == "uuid"),
            "",
        )

    def extract_common_fields(
        self, data: Dict[str, List[Dict[str, str]]]
    ) -> dict[str, str]:
        attributes = {attr["handle"]: attr["value"] for attr in data["attributes"]}
        return dict(
            email=attributes["email"],
            first_name=attributes["fname"],
            last_name=attributes["lname"],
            name=attributes["fname"] + " " + attributes["lname"],
        )

    def extract_email_addresses(
        self, data: Dict[str, List[Dict[str, str]]]
    ) -> List[EmailAddress]:
        email = [attr for attr in data["attributes"] if attr["handle"] == "email"]

        ret = []
        if email:
            ret.append(
                EmailAddress(email=email[0]["value"], verified=True, primary=True)
            )
        return ret


provider_classes = [IdmeProvider]
