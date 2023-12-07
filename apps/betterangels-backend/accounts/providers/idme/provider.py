from itertools import groupby
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
        uuid_object = [attr for attr in data["attributes"] if attr["handle"] == "uuid"]
        return str(uuid_object[0]["value"])

    def extract_common_fields(
        self, data: Dict[str, List[Dict[str, str]]]
    ) -> dict[str, str]:
        converted_data = {}
        for k, v in groupby(data["attributes"], key=lambda attr: attr["handle"]):
            converted_data[k] = list(v)[0]["value"]
        return dict(
            email=converted_data["email"],
            first_name=converted_data["fname"],
            last_name=converted_data["lname"],
            name=converted_data["fname"] + " " + converted_data["lname"],
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
