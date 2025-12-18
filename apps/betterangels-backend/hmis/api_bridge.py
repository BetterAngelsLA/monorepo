import datetime
import re
from datetime import timezone
from enum import Enum
from http import HTTPMethod
from typing import Any, Collection, Iterable, Mapping, Optional, cast
from zoneinfo import ZoneInfo

import jwt
import requests
import strawberry
from common.constants import HMIS_SESSION_KEY_NAME
from common.errors import UnauthenticatedGQLError
from common.utils import dict_keys_to_snake
from cryptography.fernet import Fernet, InvalidToken
from django import http
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied, ValidationError
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


HMIS_COOKIEJAR_SESSION_KEY = "hmis_cookiejar"
HMIS_REFRESH_URL_SESSION_KEY = "hmis_refresh_url"
_REFRESH_TIMEOUT = 10.0


class HmisApiBridge:
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

        self.http = requests.Session()
        self._rehydrate_cookies()

        self.headers = {
            "Accept": "application/json, text/plain, */*",
            "Host": HMIS_HOST,
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
            **auth_header,
        }

    def _cookiejar_to_dict(self, jar: requests.cookies.RequestsCookieJar) -> dict[str, str]:
        return cast(dict[str, str], requests.utils.dict_from_cookiejar(jar))  # type: ignore

    def _cookiejar_from_dict(self, data: Mapping[str, str]) -> requests.cookies.RequestsCookieJar:
        jar = requests.utils.cookiejar_from_dict(dict(data), cookiejar=None, overwrite=True)  # type: ignore
        return cast(requests.cookies.RequestsCookieJar, jar)

    def _rehydrate_cookies(self) -> None:
        if stored := self.session.get(HMIS_COOKIEJAR_SESSION_KEY):
            self.http.cookies = self._cookiejar_from_dict(stored)

    def _persist_cookies(self) -> None:
        self.session[HMIS_COOKIEJAR_SESSION_KEY] = self._cookiejar_to_dict(self.http.cookies)
        self.session.modified = True

    def _fernet(self) -> Fernet:
        key = getattr(settings, "HMIS_TOKEN_KEY", None)
        if not key:
            raise RuntimeError("HMIS_TOKEN_KEY is not configured")

        return Fernet(key)

    def _set_auth_token(self, token: str) -> None:
        """"""
        decoded = jwt.decode(token, options={"verify_signature": False})
        self.session.set_expiry(decoded["exp"] - decoded["iat"])

        f = self._fernet()
        self.session[self.session_key] = f.encrypt(token.encode("utf-8")).decode("utf-8")
        self.session.modified = True

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

    def _refresh_auth_token(self) -> bool:
        refresh_url = self.session.get(HMIS_REFRESH_URL_SESSION_KEY)
        if not refresh_url:
            return False

        headers = self.headers.copy()
        headers.pop("Host", None)
        headers.pop("Authorization", None)

        resp = self.http.get(
            refresh_url,
            headers=headers,
            timeout=_REFRESH_TIMEOUT,
            allow_redirects=True,
        )

        new_token = resp.cookies.get("auth_token")

        if not new_token:
            return False

        self._set_auth_token(new_token)
        self.headers["Authorization"] = f"Bearer {new_token}"
        self._persist_cookies()

        return True

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
            raise ObjectDoesNotExist("The requested Object does not exist.")

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

        if resp.status_code == 401:
            print("401! " * 20)
            if self._refresh_auth_token():
                resp = self.http.request(method, **request_args)  # type: ignore

        self._handle_error_response(resp)

        return resp

    def create_auth_token(self, username: str, password: str) -> None:
        headers = self.headers.copy()
        headers.pop("Host", None)
        login_url = f"{self.endpoint}/login"

        try:
            response = self.http.get(login_url, headers={})
            response.raise_for_status()
            html = response.text

            param_match = re.search(r'meta name="csrf-param" content="([^"]+)"', html)
            token_match = re.search(r'meta name="csrf-token" content="([^"]+)"', html)

            if not param_match or not token_match:
                raise ValidationError("❌ Error: Could not extract CSRF tokens.")

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
                self.session[HMIS_REFRESH_URL_SESSION_KEY] = post_response.url
                self.session.modified = True

                auth_token = post_response.cookies.get("auth_token")
                if not auth_token:
                    raise ValidationError(f"Status Code: {post_response.status_code}")

                self._set_auth_token(auth_token)
                self.headers["Authorization"] = f"Bearer {auth_token}"

                self._persist_cookies()

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
