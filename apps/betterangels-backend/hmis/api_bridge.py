from enum import Enum
from http import HTTPMethod
from typing import Any, Iterable, Optional

import requests
import strawberry
from common.constants import HMIS_SESSION_KEY_NAME
from common.utils import dict_keys_to_snake
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from graphql import FieldNode, FragmentSpreadNode, InlineFragmentNode, SelectionSetNode
from hmis.types import CreateHmisClientProfileInput, UpdateHmisClientProfileInput
from strawberry import UNSET, Info
from strawberry.utils.str_converters import to_snake_case

HMIS_REST_ENDPOINT = getattr(settings, "HMIS_REST_URL", None)
HMIS_HOST = getattr(settings, "HMIS_HOST", None)


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

        return {to_snake_case(k) for k in out}

    def get_client(self, hmis_id: str) -> Optional[dict[str, Any]]:
        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=("id", "last_updated", "added_date"),
        )
        fields_str = ", ".join(fields)

        resp = self._make_request(
            path=f"/clients/{hmis_id}",
            body={"fields": fields_str},
        )

        if resp.status_code == 404:
            raise ObjectDoesNotExist("The requested Client does not exist.")

        return dict(resp.json())

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
                "middle_name": cleaned_data.get("middle_name", None),
                "name_suffix": cleaned_data.get("name_suffix", None),
                "race_ethnicity": [99],
                "veteran": 99,
            },
            "fields": (
                "id, personal_id, unique_identifier, added_date, last_updated, "
                "first_name, last_name, ssn3, name_quality, dob_quality, ssn_quality, "
                "middle_name, name_suffix, gender, race_ethnicity, veteran_status, "
            ),
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
        data: dict[str, Any],
        keys: Iterable[str],
        enum_keys: Iterable[str] = (),
    ) -> dict[str, Any]:
        cleaned = {k: self._enum_value(v) for k, v in data.items() if k in keys and v is not UNSET}

        for k in enum_keys:
            if k in cleaned and cleaned[k] is not None:
                cleaned[k] = [self._enum_value(i) for i in cleaned[k]]

        return cleaned

    def update_client(self, data: UpdateHmisClientProfileInput) -> dict[str, Any]:
        data_dict = strawberry.asdict(data)
        hmis_id = data_dict.pop("hmis_id")

        client_keys = {"first_name", "last_name", "ssn3", "birth_date", "name_quality", "dob_quality", "ssn_quality"}
        screen_keys = {"alias", "gender", "middle_name", "name_suffix", "race_ethnicity", "veteran"}

        cleaned_client_input = self._clean(data=data_dict, keys=client_keys)
        cleaned_screen_input = self._clean(data=data_dict, keys=screen_keys, enum_keys=("gender", "race_ethnicity"))

        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=("id", "last_updated", "added_date"),
        )
        combined_fields = fields | {*cleaned_client_input.keys()} | {*cleaned_screen_input.keys()}
        fields_str = ", ".join(combined_fields)

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
