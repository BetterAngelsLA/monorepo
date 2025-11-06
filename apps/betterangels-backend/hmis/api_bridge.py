import datetime
from enum import Enum
from http import HTTPMethod
from typing import Any, Collection, Iterable, Mapping, Optional

import requests
import strawberry
from common.constants import HMIS_SESSION_KEY_NAME
from common.utils import dict_keys_to_snake
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from graphql import FieldNode, FragmentSpreadNode, InlineFragmentNode, SelectionSetNode
from hmis.types import CreateHmisClientProfileInput
from strawberry import UNSET, Info
from strawberry.utils.str_converters import to_snake_case

HMIS_REST_ENDPOINT = getattr(settings, "HMIS_REST_URL", None)
HMIS_HOST = getattr(settings, "HMIS_HOST", None)

METADATA_FIELDS = {
    "id",
    "unique_identifier",
    "personal_id",
    "added_date",
    "last_updated",
}
CLIENT_FIELDS = {
    "first_name",
    "last_name",
    "alias",
    "birth_date",
    "dob_quality",
    "name_quality",
    "ssn1",
    "ssn2",
    "ssn3",
    "ssn_quality",
}
SV_FIELDS = {
    "name_middle",
    "name_suffix",
    "age",
    "gender",
    "gender_identity_text",
    "race_ethnicity",
    "additional_race_ethnicity_detail",
    "veteran",
}
EXCLUDED_BA_FIELDS = {
    "ada_accommodation",
    "address",
    "california_id",
    "email",
    "eye_color",
    "hair_color",
    "height_in_inches",
    "important_notes",
    "living_situation",
    "mailing_address",
    "marital_status",
    "nickname",
    "phone_number",
    "physical_description",
    "place_of_birth",
    "preferred_communication",
    "preferred_language",
    "pronouns",
    "pronouns_other",
    "residence_address",
    "residence_geolocation",
    "spoken_languages",
}


class HmisApiRestBridge:
    """Utility class for interfacing with HMIS REST API."""

    def __init__(self, info: strawberry.Info) -> None:
        self.info = info
        self.request = self.info.context["request"]
        self.session = self.request.session

        if HMIS_REST_ENDPOINT is None or HMIS_SESSION_KEY_NAME is None or HMIS_HOST is None:
            raise Exception("HMIS not configured")

        self.endpoint = HMIS_REST_ENDPOINT
        self.session_key = HMIS_SESSION_KEY_NAME

        token = self._get_auth_token()
        auth_header = {"Authorization": f"Bearer {token}"} if token else {}

        self.headers = {
            "Accept": "application/json, text/plain, */*",
            "Host": HMIS_HOST,
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
            **auth_header,
        }

    def _make_request(
        self,
        path: str,
        body: dict[str, Any],
        method: HTTPMethod = HTTPMethod.GET,
        timeout: Optional[float] = None,
    ) -> requests.Response:
        request_args = {
            "url": f"{self.endpoint}{path}",
            "headers": self.headers,
            "json": body,
            "timeout": timeout,
        }

        return requests.request(method, **request_args)  # type: ignore

    def _fernet(self) -> Fernet:
        key = getattr(settings, "HMIS_TOKEN_KEY", None)
        if not key:
            raise RuntimeError("HMIS_TOKEN_KEY is not configured")

        return Fernet(key)

    def _get_auth_token(self) -> Optional[str]:
        enc = self.session.get(self.session_key)

        if not enc:
            return None

        try:
            f = self._fernet()
            return f.decrypt(enc.encode("utf-8")).decode("utf-8")
        except (InvalidToken, ValueError):
            self._clear_auth_token()

            return None

    def _clear_auth_token(self) -> None:
        if self.session_key in self.session:
            del self.session[self.session_key]

        self.session.modified = True

    def _get_field_dot_paths(
        self,
        info: Info,
        default_fields: Optional[Iterable[str]],
        selection_set: Optional[SelectionSetNode] = None,
    ) -> set[str]:
        """Accesses selected query fields from operation info and returns a set of dot paths.

        e.g.,
        ```
            query {
                firstName
                lastName
                address {
                    city
                    state
                    zip
                }
            }
        ```

        returns

        `{"first_name", "last_name", "address.number", "address.city", "address.state", "address.zip"}`
        """

        sel = selection_set or info.operation.selection_set
        out = set(default_fields or [])
        frags = info._raw_info.fragments
        seen = set()

        def fname(n: FieldNode) -> str:
            return n.alias.value if n.alias else n.name.value

        stack: list[tuple[tuple[str, ...], SelectionSetNode]] = []

        # seed from top-level
        for n in sel.selections:
            if isinstance(n, FieldNode) and n.selection_set:
                stack.append(((), n.selection_set))
            elif isinstance(n, FragmentSpreadNode):
                name = n.name.value
                if name not in seen:
                    seen.add(name)
                    stack.append(((), frags[name].selection_set))
            elif isinstance(n, InlineFragmentNode) and n.selection_set:
                stack.append(((), n.selection_set))

        # DFS
        while stack:
            prefix, sset = stack.pop()
            for n in sset.selections:
                if isinstance(n, FieldNode):
                    path = (*prefix, fname(n))
                    if n.selection_set:
                        stack.append((path, n.selection_set))
                    else:
                        out.add(".".join(path))
                elif isinstance(n, FragmentSpreadNode):
                    name = n.name.value
                    if name not in seen:
                        seen.add(name)
                        stack.append((prefix, frags[name].selection_set))
                elif isinstance(n, InlineFragmentNode) and n.selection_set:
                    stack.append((prefix, n.selection_set))

        snake_out = {to_snake_case(k) for k in out}

        return {f"screenValues.{k}" if k in SV_FIELDS else k for k in snake_out}

    def get_client(self, hmis_id: str) -> dict[str, Any]:
        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=("id", "last_updated", "added_date"),
        )

        fields_str = ", ".join(fields - EXCLUDED_BA_FIELDS)

        resp = self._make_request(
            path=f"/clients/{hmis_id}",
            body={"fields": fields_str},
        )

        if resp.status_code == 404:
            raise ObjectDoesNotExist("The requested Client does not exist.")

        return dict_keys_to_snake(resp.json())

    def create_client(self, data: CreateHmisClientProfileInput) -> dict[str, Any]:
        data_dict = strawberry.asdict(data)
        cleaned_data = {k: (v.value if isinstance(v, Enum) else v) for k, v in data_dict.items() if v is not UNSET}

        body = {
            "client": {
                "first_name": cleaned_data.get("first_name", None),
                "last_name": cleaned_data.get("last_name", None),
                "ssn3": "xxxx",
                "name_quality": cleaned_data.get("name_quality", 99),
                "dob_quality": 99,
                "ssn_quality": 99,
            },
            "screenValues": {
                "alias": cleaned_data.get("nickname", None),
                "gender": [99],
                "name_middle": cleaned_data.get("name_middle", None),
                "name_suffix": cleaned_data.get("name_suffix", None),
                "race_ethnicity": [99],
                "veteran": 99,
            },
            "fields": ", ".join(METADATA_FIELDS | CLIENT_FIELDS | {f"screenValues.{k}" for k in SV_FIELDS}),
        }

        resp = self._make_request(
            method=HTTPMethod.POST,
            path="/clients",
            body=body,
        )

        if resp.status_code != 200:
            raise ValidationError("Something went wrong.")

        return dict_keys_to_snake(resp.json())

    def _enum_value(self, v: Any) -> Any:
        return v.value if isinstance(v, Enum) else v

    def _clean(
        self,
        data: Mapping[str, Any],
        keys: Collection[str],
        enum_list_keys: Collection[str] = (),
        date_keys: Collection[str] = (),
    ) -> dict[str, Any]:
        cleaned: dict[str, Any] = {}

        for k, v in data.items():
            if k not in keys or v is UNSET:
                continue

            if k in enum_list_keys and v is not None:
                cleaned[k] = [self._enum_value(i) for i in v]
                continue

            if k in date_keys and v is not None:
                if isinstance(v, (datetime.date)):
                    cleaned[k] = v.strftime("%Y-%m-%d")
                else:
                    cleaned[k] = str(v)
                continue

            cleaned[k] = self._enum_value(v)

        return cleaned

    def update_client(self, data: dict[str, Any]) -> dict[str, Any]:
        hmis_id = data.pop("hmis_id")

        cleaned_client_input = self._clean(
            data=data,
            keys=CLIENT_FIELDS,
            date_keys=("birth_date"),
        )
        cleaned_screen_input = self._clean(
            data=data,
            keys=SV_FIELDS,
            enum_list_keys=("gender", "race_ethnicity"),
        )

        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=("id", "last_updated", "added_date"),
        )

        combined_fields = fields | {*cleaned_client_input.keys()} | {*cleaned_screen_input.keys()}
        fields_str = ", ".join(combined_fields - EXCLUDED_BA_FIELDS)

        body = {
            k: v
            for k, v in {
                "client": cleaned_client_input,
                "screenValues": cleaned_screen_input,
                "fields": fields_str,
            }.items()
            if v
        }

        resp = self._make_request(
            method=HTTPMethod.PUT,
            path=f"/clients/{hmis_id}",
            body=body,
        )

        if resp.status_code != 200:
            raise ValidationError("Something went wrong.")

        return dict_keys_to_snake(resp.json())
