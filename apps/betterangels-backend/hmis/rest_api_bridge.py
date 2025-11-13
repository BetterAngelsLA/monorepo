import datetime
from datetime import timezone
from enum import Enum
from http import HTTPMethod
from typing import Any, Collection, Iterable, Mapping, Optional
from zoneinfo import ZoneInfo

import requests
import strawberry
from common.constants import HMIS_SESSION_KEY_NAME
from common.utils import dict_keys_to_snake
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from graphql import FieldNode, FragmentSpreadNode, InlineFragmentNode, SelectionSetNode
from hmis.types import (
    CreateHmisClientProfileInput,
    CreateHmisNoteInput,
    UpdateHmisNoteInput,
)
from strawberry import UNSET, Info
from strawberry.utils.str_converters import to_snake_case

DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
LOS_ANGELES_TZ = "America/Los_Angeles"
CLIENT_DATE_FORMAT = "%Y-%m-%d"
PROGRAM_NOTE_DATE_FORMAT = "%Y-%m-%d"
NOTE_DATE_FORMAT = "%m/%d/%Y"

METADATA_FIELDS = {"id", "added_date", "last_updated"}
NOTE_FIELDS = {"title", "note", "date", "ref_client_program"}
CLIENT_FIELDS = {
    "unique_identifier",
    "personal_id",
    "alias",
    "birth_date",
    "dob_quality",
    "first_name",
    "last_name",
    "name_quality",
    "ssn1",
    "ssn2",
    "ssn3",
    "ssn_quality",
}
CLIENT_SUB_FIELDS = {
    "age",
    "gender",
    "gender_identity_text",
    "name_middle",
    "name_suffix",
    "race_ethnicity",
    "additional_race_ethnicity_detail",
    "veteran",
}
BA_CLIENT_FIELDS = {
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


class HmisRestApiBridge:
    """Utility class for interfacing with HMIS REST API."""

    def __init__(self, info: strawberry.Info) -> None:
        self.info = info
        self.request = self.info.context["request"]
        self.session = self.request.session
        HMIS_REST_ENDPOINT = getattr(settings, "HMIS_REST_URL", None)
        HMIS_HOST = getattr(settings, "HMIS_HOST", None)
        if not all([HMIS_REST_ENDPOINT, HMIS_SESSION_KEY_NAME, HMIS_HOST]):
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

    def _handle_error_response(self, resp: requests.Response) -> None:
        if resp.status_code == 200:
            return

        if resp.status_code == 401:
            raise PermissionError("Session expired. Please login again.")

        if resp.status_code == 404:
            raise ObjectDoesNotExist("The requested Object does not exist.")

        if resp.status_code == 422:
            raise ValidationError(resp.text)

        raise ValidationError("Something went wrong.")

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

        resp = requests.request(method, **request_args)  # type: ignore

        self._handle_error_response(resp)

        return resp

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

        return {f"screenValues.{k}" if k in CLIENT_SUB_FIELDS else k for k in snake_out}

    def _convert_to_utc(
        self, dt_str: str, dt_format: str = DATETIME_FORMAT, tz: str = LOS_ANGELES_TZ
    ) -> datetime.datetime:
        """Converts naive local datetime string to aware UTC datetime.

        dt_str: datetime string
        dt_format: datetime string format
        tz: local timezone
        """

        return datetime.datetime.strptime(dt_str, dt_format).replace(tzinfo=ZoneInfo(tz)).astimezone(timezone.utc)

    def _format_timestamp_fields(self, data: dict[str, Any]) -> dict[str, Any]:
        formatted_data = {
            **data,
            "added_date": self._convert_to_utc(data["added_date"]),
            "last_updated": self._convert_to_utc(data["last_updated"]),
        }

        if date := data.get("date"):
            formatted_data["date"] = datetime.date.fromisoformat(date)
        if birth_date := data.get("birth_date"):
            formatted_data["birth_date"] = datetime.date.fromisoformat(birth_date)

        return formatted_data

    def _enum_value(self, v: Any) -> Any:
        return v.value if isinstance(v, Enum) else v

    def _clean_client_input(
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
                    cleaned[k] = v.strftime(CLIENT_DATE_FORMAT)
                else:
                    cleaned[k] = str(v)
                continue

            cleaned[k] = self._enum_value(v)

        return cleaned

    def _format_client_data(self, client_data: dict[str, Any]) -> dict[str, Any]:
        client_data = self._format_timestamp_fields(dict_keys_to_snake(client_data))
        client_sub_field_data = {**client_data.pop("screen_values", {})}

        return {
            "hmis_id": client_data.pop("id"),
            **client_data,
            **client_sub_field_data,
        }

    def _format_note_data(self, note_data: dict[str, Any]) -> dict[str, Any]:
        note_data = self._format_timestamp_fields(dict_keys_to_snake(note_data))

        return {"hmis_id": note_data.pop("id"), **note_data}

    def _get_field_str(self, fields: Iterable[str]) -> str:
        return ",".join(fields)

    def get_client(self, hmis_id: str) -> dict[str, Any]:
        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=METADATA_FIELDS,
        )

        fields_str = self._get_field_str(fields - BA_CLIENT_FIELDS)

        resp = self._make_request(
            path=f"/clients/{hmis_id}",
            body={"fields": fields_str},
        )

        return self._format_client_data(resp.json())

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
            "fields": self._get_field_str(
                METADATA_FIELDS | CLIENT_FIELDS | {f"screenValues.{k}" for k in CLIENT_SUB_FIELDS}
            ),
        }

        resp = self._make_request(
            method=HTTPMethod.POST,
            path="/clients",
            body=body,
        )

        return self._format_client_data(resp.json())

    def update_client(self, data: dict[str, Any]) -> dict[str, Any]:
        hmis_id = data.pop("hmis_id")

        hmis_data = {k: v for k, v in data.items() if k not in BA_CLIENT_FIELDS}

        cleaned_client_field_input = self._clean_client_input(
            data=hmis_data,
            keys=CLIENT_FIELDS,
            date_keys=("birth_date"),
        )
        cleaned_client_sub_field_input = self._clean_client_input(
            data=hmis_data,
            keys=CLIENT_SUB_FIELDS,
            enum_list_keys=("gender", "race_ethnicity"),
        )

        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=METADATA_FIELDS,
        )

        combined_fields = fields | {*cleaned_client_field_input.keys()} | {*cleaned_client_sub_field_input.keys()}
        fields_str = ", ".join(combined_fields - BA_CLIENT_FIELDS)

        body = {
            k: v
            for k, v in {
                "client": cleaned_client_field_input,
                "screenValues": cleaned_client_sub_field_input,
                "fields": fields_str,
            }.items()
            if v
        }

        resp = self._make_request(
            method=HTTPMethod.PUT,
            path=f"/clients/{hmis_id}",
            body=body,
        )

        return self._format_client_data(resp.json())

    def get_note(self, client_hmis_id: str, note_hmis_id: str) -> dict[str, Any]:
        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=METADATA_FIELDS | {"client.id"},
        )

        fields_str = ", ".join(fields)

        resp = self._make_request(
            path=f"/clients/{client_hmis_id}/client-notes/{note_hmis_id}",
            body={"fields": fields_str},
        )

        return self._format_note_data(resp.json())

    def create_note(self, client_hmis_id: int, data: CreateHmisNoteInput) -> dict[str, Any]:
        path = f"/clients/{client_hmis_id}/client-notes"
        date = data.date.strftime(NOTE_DATE_FORMAT)

        if client_program_id := data.ref_client_program:
            path = f"/clients/{client_hmis_id}/client-programs/{client_program_id}/client-notes"
            date = data.date.strftime(PROGRAM_NOTE_DATE_FORMAT)

        body = {
            "clientNote": {
                "title": data.title,
                "ref_client_program": data.ref_client_program or None,
                "date": date,
                "note": data.note,
                "category": {"code": 1},
                "ref_category": "1",
                "private": "0",
                "tracking_hour": None,
                "tracking_minute": None,
            },
            "fields": self._get_field_str(METADATA_FIELDS | NOTE_FIELDS | {"client.id"}),
        }

        resp = self._make_request(method=HTTPMethod.POST, path=path, body=body)

        return self._format_note_data(resp.json())

    def update_note(
        self,
        client_hmis_id: int,
        note_hmis_id: int,
        data: UpdateHmisNoteInput,
    ) -> dict[str, Any]:
        note_data = {
            k: (v.strftime(NOTE_DATE_FORMAT) if isinstance(v, datetime.date) else v)
            for k, v in strawberry.asdict(data).items()
            if v is not UNSET
        }

        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=METADATA_FIELDS | {"client.id"},
        )

        body = {
            "clientNote": note_data,
            "fields": self._get_field_str(fields | {*note_data.keys()}),
        }

        resp = self._make_request(
            method=HTTPMethod.PUT,
            path=f"/clients/{client_hmis_id}/client-notes/{note_hmis_id}",
            body=body,
        )

        return self._format_note_data(resp.json())
