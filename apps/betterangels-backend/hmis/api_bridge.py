import datetime
import re
from datetime import timezone
from enum import Enum
from http import HTTPMethod
from typing import Any, Collection, Iterable, Mapping, Optional
from zoneinfo import ZoneInfo

import requests
import strawberry
from common.constants import HMIS_AUTH_COOKIE_NAME
from common.errors import NotFoundGQLError, UnauthenticatedGQLError
from common.utils import dict_keys_to_snake
from django.conf import settings
from django.core.exceptions import PermissionDenied, ValidationError
from graphql import (
    FieldNode,
    FragmentSpreadNode,
    GraphQLError,
    InlineFragmentNode,
    SelectionSetNode,
)
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
CLIENT_PROGRAM_FIELDS = {"clientProgram.id", "clientProgram.program.id", "clientProgram.program.name"}
CLIENT_FIELDS = {
    "unique_identifier",
    "personal_id",
    # "alias",  # TODO: Turn on when API fixes alias returning null issue
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
    "hmisId",
    "adaAccommodation",
    "address",
    "californiaId",
    "email",
    "eyeColor",
    "hairColor",
    "heightInInches",
    "importantNotes",
    "livingSituation",
    "mailingAddress",
    "maritalStatus",
    "nickname",
    "phoneNumber",
    "physicalDescription",
    "placeOfBirth",
    "preferredCommunication",
    "preferredLanguage",
    "pronouns",
    "pronounsOther",
    "residenceAddress",
    "residenceGeolocation",
    "spokenLanguages",
}
BA_NOTE_FIELDS = {"hmisId", "createdBy", "hmisClientProfile"}


class HmisApiBridge:
    """Utility class for interfacing with HMIS REST API."""

    def __init__(self, info: strawberry.Info) -> None:
        self.info = info
        request = self.info.context["request"]
        hmis_rest_endpoint = getattr(settings, "HMIS_REST_URL", None)
        hmis_host = getattr(settings, "HMIS_HOST", None)
        if not all([hmis_rest_endpoint, hmis_host]):
            raise Exception("HMIS_REST_URL and HMIS_HOST must be configured in settings")

        self.endpoint = hmis_rest_endpoint

        # Extract token from X-HMIS-Token header
        token = request.META.get("HTTP_X_HMIS_TOKEN")
        auth_header = {"Authorization": f"Bearer {token}"} if token else {}

        # Forward the client User-Agent to HMIS when available.
        # This allows callers (including curl test scripts) to control UA without us spoofing a browser.
        forwarded_user_agent = (request.headers.get("User-Agent") or "").strip()
        user_agent_header = {"User-Agent": forwarded_user_agent} if forwarded_user_agent else {}

        self.http = requests.Session()

        self.headers = {
            "Accept": "application/json, text/plain, */*",
            "Host": hmis_host,
            **auth_header,
            **user_agent_header,
        }

    def _get_field_dot_paths(
        self,
        info: Info,
        default_fields: Optional[Iterable[str]] = None,
        ignored_fields: Optional[Iterable[str]] = None,
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

        ignored = set((ignored_fields or []))

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
                    field_name = fname(n)
                    path_tuple = (*prefix, field_name)
                    dot_path = ".".join(path_tuple)

                    if dot_path in ignored or field_name in ignored:
                        continue

                    if n.selection_set:
                        stack.append((path_tuple, n.selection_set))
                    else:
                        out.add(".".join(path_tuple))
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

        try:
            return datetime.datetime.strptime(dt_str, dt_format).replace(tzinfo=ZoneInfo(tz)).astimezone(timezone.utc)
        except ValueError as e:
            raise ValueError(f"Failed to parse datetime string '{dt_str}' with format '{dt_format}': {e}") from e

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

    def _handle_error_response(self, resp: requests.Response) -> None:
        if resp.status_code == 200:
            return

        if resp.status_code == 401:
            raise UnauthenticatedGQLError()

        if resp.status_code == 403:
            raise PermissionDenied("Unauthorized.")

        if resp.status_code == 404:
            raise NotFoundGQLError()

        if resp.status_code == 422:
            errors = [
                {
                    "field": f"{k}",
                    "location": None,
                    "errorCode": "422",
                    "message": f"{v}",
                }
                for k, v in resp.json()["messages"].items()
            ]

            raise GraphQLError("Validation Errors", extensions={"errors": errors})

    def _forward_cookies_to_client(self, resp: requests.Response) -> None:
        django_response = self.info.context.get("response")
        if not django_response:
            return

        for cookie in resp.cookies:
            django_response.set_cookie(
                key=cookie.name,
                value=cookie.value,
                domain=cookie.domain,
                path=cookie.path,
                secure=cookie.secure,
                httponly=cookie.has_nonstandard_attr("HttpOnly"),
                samesite="Lax",
            )

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
        resp = self.http.request(method, **request_args)  # type: ignore

        self._handle_error_response(resp)

        # Transparently forward any cookie updates from HMIS to the client
        if "Set-Cookie" in resp.headers:
            self._forward_cookies_to_client(resp)

        return resp

    def login(self, username: str, password: str) -> None:
        headers = self.headers.copy()
        headers.pop("Host", None)
        headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        login_url = f"{self.endpoint}/login"

        try:
            response = self.http.get(login_url, headers=headers, allow_redirects=True)
            response.raise_for_status()

            html = response.text

            param_match = re.search(r'meta name="csrf-param" content="([^"]+)"', html)
            token_match = re.search(r'meta name="csrf-token" content="([^"]+)"', html)

            if not param_match or not token_match:
                raise ValidationError("Could not extract CSRF tokens from HMIS login page")

            csrf_key = param_match.group(1)
            csrf_val = token_match.group(1)

            payload = {
                csrf_key: csrf_val,
                "LoginForm[username]": username,
                "LoginForm[password]": password,
                "LoginForm[external_idp_id]": "",
                "LoginForm[fingerPrint]": "",
            }

            post_response = self.http.post(
                url=login_url,
                data=payload,
                headers=headers,
                allow_redirects=True,
            )

            if post_response.url != login_url and "login" not in post_response.url:
                auth_token = post_response.cookies.get(HMIS_AUTH_COOKIE_NAME)
                if not auth_token:
                    raise ValidationError(f"Status Code: {post_response.status_code}")

                # Forward cookies from login response to client
                self._forward_cookies_to_client(post_response)
                return

            elif "Incorrect username or password" in post_response.text:
                raise PermissionDenied("Login Failed: Invalid credentials.")

            else:
                raise ValidationError(f"Status Code: {post_response.status_code}")

        except Exception as e:
            raise ValidationError(f"An error occurred: {e}")

    def get_client(self, hmis_id: str) -> dict[str, Any]:
        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=METADATA_FIELDS,
            ignored_fields={*BA_CLIENT_FIELDS, "alias"},
        )

        fields_str = self._get_field_str(fields)

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
                "alias": cleaned_data.get("alias", None),
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
            info=self.info, default_fields=METADATA_FIELDS, ignored_fields={*BA_CLIENT_FIELDS, "alias"}
        )

        combined_fields = fields | {*cleaned_client_field_input.keys()} | {*cleaned_client_sub_field_input.keys()}
        fields_str = ", ".join(combined_fields)

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
            default_fields=METADATA_FIELDS,
            ignored_fields=BA_NOTE_FIELDS,
        )

        fields_str = ", ".join(fields | CLIENT_PROGRAM_FIELDS)

        resp = self._make_request(
            path=f"/clients/{client_hmis_id}/client-notes/{note_hmis_id}",
            body={"fields": fields_str},
        )

        return self._format_note_data(resp.json())

    def create_note(self, client_hmis_id: str, data: CreateHmisNoteInput) -> dict[str, Any]:
        path = f"/clients/{client_hmis_id}/client-notes"
        date = data.date.strftime(NOTE_DATE_FORMAT)
        fields = METADATA_FIELDS | NOTE_FIELDS

        if client_program_id := data.ref_client_program:
            path = f"/clients/{client_hmis_id}/client-programs/{client_program_id}/client-notes"
            date = data.date.strftime(PROGRAM_NOTE_DATE_FORMAT)
            fields |= CLIENT_PROGRAM_FIELDS

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
            "fields": self._get_field_str(fields),
        }

        resp = self._make_request(method=HTTPMethod.POST, path=path, body=body)

        return self._format_note_data(resp.json())

    def update_note(
        self,
        client_hmis_id: str,
        note_hmis_id: str,
        data: UpdateHmisNoteInput,
    ) -> dict[str, Any]:
        note_data = {
            k: (v.strftime(NOTE_DATE_FORMAT) if isinstance(v, datetime.date) else v)
            for k, v in strawberry.asdict(data).items()
            if v is not UNSET
        }

        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=METADATA_FIELDS | NOTE_FIELDS,
            ignored_fields=BA_NOTE_FIELDS,
        )

        body = {
            "clientNote": note_data,
            "fields": self._get_field_str(fields | {*note_data.keys()} | CLIENT_PROGRAM_FIELDS),
        }

        resp = self._make_request(
            method=HTTPMethod.PUT,
            path=f"/clients/{client_hmis_id}/client-notes/{note_hmis_id}",
            body=body,
        )

        return self._format_note_data(resp.json())

    def get_client_programs(self, client_hmis_id: str) -> dict[str, Any]:
        fields = self._get_field_dot_paths(info=self.info, ignored_fields=BA_NOTE_FIELDS)

        body = {"fields": self._get_field_str(fields)}
        resp = self._make_request(
            path=f"/clients/{client_hmis_id}/client-programs",
            body=body,
        )

        return dict_keys_to_snake(resp.json())

    def create_client_program(
        self,
        client_hmis_id: str,
        program_hmis_id: int = 2,
    ) -> dict[str, Any]:
        DEFAULT_ENROLLMENT_DATA = {
            "programId": program_hmis_id,
            "sex": 99,
            "screenValues": {
                "disabled": 99,
                "enrollment_coc": "Default",
                "health_chronic": 99,
                "health_dev_disability": 99,
                "health_hiv": 99,
                "health_insurance": 99,
                "health_mental": 99,
                "health_phys_disability": 99,
                "health_substance_abuse": 99,
                "program_date": "2001-01-01",
            },
        }
        fields = {"id", "ref_client", "ref_program"}
        resp = self._make_request(
            method=HTTPMethod.POST,
            path=f"/clients/{client_hmis_id}/client-programs/enroll",
            body={**DEFAULT_ENROLLMENT_DATA, "fields": self._get_field_str(fields)},
        )

        return dict_keys_to_snake(resp.json())
