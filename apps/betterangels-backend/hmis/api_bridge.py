import json
import re
from http import HTTPMethod
from typing import Any, Optional

import jwt
import requests
import strawberry
from common.constants import HMIS_SESSION_KEY_NAME
from common.errors import UnauthenticatedGQLError
from common.utils import dict_keys_to_camel, dict_keys_to_snake
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpRequest
from django.utils.module_loading import import_string
from graphql import (
    FieldNode,
    FragmentSpreadNode,
    GraphQLField,
    GraphQLObjectType,
    GraphQLSchema,
    InlineFragmentNode,
    SelectionSetNode,
    parse,
    specified_rules,
    validate,
)
from graphql.type import GraphQLObjectType as _GraphQLObjectType
from hmis.errors import is_hmis_unauthenticated
from hmis.types import HmisClientFilterInput, HmisPaginationInput
from strawberry import Info

HMIS_GRAPHQL_ENDPOINT = getattr(settings, "HMIS_GRAPHQL_URL", None)
HMIS_REST_ENDPOINT = getattr(settings, "HMIS_REST_URL", None)
HMIS_HOST = getattr(settings, "HMIS_HOST", None)
HMIS_GRAPHQL_API_KEY = getattr(settings, "HMIS_API_KEY", None)
GRAPHQL_SCHEMA_PATH = "betterangels_backend.schema.schema"


class HmisApiBridge:
    """Utility class for interfacing with HMIS GraphQL API."""

    def __init__(self, request: HttpRequest) -> None:
        self.request = request
        self.session = request.session

        if HMIS_GRAPHQL_ENDPOINT is None or HMIS_GRAPHQL_API_KEY is None or HMIS_SESSION_KEY_NAME is None:
            raise Exception("HMIS not configured")

        self.endpoint = HMIS_GRAPHQL_ENDPOINT
        self.api_key = HMIS_GRAPHQL_API_KEY
        self.schema = self._load_graphql_schema()
        self.session_key = HMIS_SESSION_KEY_NAME

        token = self._get_auth_token()
        auth_header = {"Authorization": f"Bearer {token}"} if token else {}

        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            **auth_header,
        }

    def _load_graphql_schema(self) -> GraphQLSchema:
        obj = import_string(GRAPHQL_SCHEMA_PATH)

        return getattr(obj, "_schema", obj)  # type: ignore

    def _make_request(self, body: dict[str, Any], timeout: Optional[float] = None) -> dict[str, Any]:
        resp = requests.post(
            self.endpoint,
            headers=self.headers,
            json=body,
            timeout=timeout,
        )

        response = resp.json() or {}

        if errors := response.get("errors"):
            if is_hmis_unauthenticated(errors):
                # TODO: destroy session here?
                raise UnauthenticatedGQLError()

        # If server replies non-JSON on error, .json() will raise — we treat as failure.
        return response

    def _validate_selection_for_type(
        self,
        object_typename: str,
        selection: str,
    ) -> str:
        """Validate query contents against provided type."""
        if not selection.strip():
            raise ValueError("Empty selection set.")

        gql_type = self.schema.get_type(object_typename)
        if not isinstance(gql_type, _GraphQLObjectType):
            raise ValueError(f"Type '{object_typename}' is not an object type in the schema.")

        Q = GraphQLObjectType(name="_Q", fields=lambda: {"_x": GraphQLField(gql_type)})
        synthetic = GraphQLSchema(query=Q, types=list(self.schema.type_map.values()))

        # Parse & validate: query { _x { <selection> } }
        doc = parse(f"query __Q__ {{ _x {{ {selection} }} }}")
        rules = list(specified_rules)
        errors = validate(synthetic, doc, rules)
        if errors:
            raise ValueError("; ".join(e.message for e in errors))

        return selection

    def _build_client_mutation(self, operation: str, response_fields: str, expected_type: str) -> str:
        operation_cap = operation.capitalize()
        cleaned_fields = re.sub(r"\\n", "", response_fields)
        safe_selection = self._validate_selection_for_type(expected_type, cleaned_fields)

        return f"""
            mutation (
                $clientInput: {operation_cap}ClientInput!,
                $clientSubItemsInput: {operation_cap}ClientSubItemsInput!
            ) {{
                {operation}Client(
                    client: $clientInput,
                    data: $clientSubItemsInput
                ) {{
                    {safe_selection}
                }}
            }}
        """

    def _build_client_note_mutation(self, operation: str, response_fields: str, expected_type: str) -> str:
        operation_cap = operation.capitalize()
        cleaned_fields = re.sub(r"\\n", "", response_fields)
        safe_selection = self._validate_selection_for_type(expected_type, cleaned_fields)

        return f"""
            mutation (
                $clientNoteInput: {operation_cap}ClientNoteInput!,
            ) {{
                {operation}ClientNote(
                    data: $clientNoteInput,
                ) {{
                    {safe_selection}
                }}
            }}
        """

    def _run_client_mutation(
        self,
        operation: str,
        client_input: dict[str, Any],
        client_sub_items_input: dict[str, Any],
    ) -> dict[str, Any]:
        raw_query = self.request.body.decode("utf-8")
        response_fields = self._extract_response_fields(raw_query)

        variables = {
            "clientInput": dict_keys_to_camel(client_input),
            "clientSubItemsInput": dict_keys_to_camel(client_sub_items_input),
        }

        data = self._make_request(
            {
                "query": self._build_client_mutation(operation, response_fields, "HmisClientType"),
                "variables": variables,
            }
        )

        if errors := data.get("errors"):
            return {"errors": errors}

        return data.get("data", {}).get(f"{operation}Client") or {}

    def _run_client_note_mutation(
        self,
        operation: str,
        client_note_input: dict[str, Any],
    ) -> dict[str, Any]:
        raw_query = self.request.body.decode("utf-8")
        response_fields = self._extract_response_fields(raw_query)

        variables = {
            "clientNoteInput": dict_keys_to_camel(client_note_input),
        }

        data = self._make_request(
            {
                "query": self._build_client_note_mutation(operation, response_fields, "HmisClientNoteType"),
                "variables": variables,
            }
        )

        if errors := data.get("errors"):
            return {"errors": errors}

        return data.get("data", {}).get(f"{operation}ClientNote") or {}

    def _extract_response_fields(
        self,
        mutation: str,
    ) -> str:
        """
        Extracts everything inside the `... on Hmis...Type { ... }` block.
        Returns the inner query portion as a string.
        """

        match = re.search(r"\.\.\.\s+on\s+Hmis\w*Type\b\s*{", mutation)
        if not match:
            return ""

        start = match.end()
        depth = 1
        i = start

        while i < len(mutation) and depth > 0:
            if mutation[i] == "{":
                depth += 1
            elif mutation[i] == "}":
                depth -= 1
            i += 1

        return mutation[start : i - 1].strip()

    def _format_query(self, original_query: bytes, expected_type: str, is_list_query: bool = False) -> str:
        # convert from byte string
        query = json.loads(original_query.decode("utf-8"))["query"]
        response_fields = self._extract_response_fields(query)
        self._validate_selection_for_type(expected_type, response_fields)

        # remove hmis prefix from query name
        query = re.sub(r"hmis([A-Z])", lambda m: m.group(1).lower(), query)

        # remove our error type definition
        query = re.sub(r"\.\.\.\s*on\s+Hmis\w*Error\s*{[^}]*}", "", query)

        # convert HmisObjectType -> Object
        query = re.sub(r"\bHmis(\w+)Type\b", r"\1", query)

        # convert HmisObjectInput → ObjectInput
        query = re.sub(r"Hmis", "", query)

        # if returning list, update pagination args
        if is_list_query:
            # convert pagination fields to snake case
            query = re.sub(r"perPage", "per_page", query)
            query = re.sub(r"currentPage", "current_page", query)
            query = re.sub(r"pageCount", "page_count", query)
            query = re.sub(r"totalCount", "total_count", query)

        return query

    def _format_enrollments_query(self, original_query: str) -> str:
        # move personalId into filter arg
        return re.sub(r"personalId:\s*\$personalId", r"filter: {personalId: $personalId}", original_query)

    def _format_client_notes_query(self, original_query: str) -> str:
        # move ids into filter arg
        return re.sub(
            r"personalId:\s*\$personalId\s*,\s*enrollmentId:\s*\$enrollmentId",
            r"filter: {personalId: $personalId, enrollmentId: $enrollmentId}",
            original_query,
        )

    def _fernet(self) -> Fernet:
        key = getattr(settings, "HMIS_TOKEN_KEY", None)
        if not key:
            raise RuntimeError("HMIS_TOKEN_KEY is not configured")

        return Fernet(key)

    def _set_auth_token(self, token: str) -> None:
        """"""
        decoded = jwt.decode(token, options={"verify_signature": False})
        self.session.set_expiry(decoded["exp"] - decoded["iat"] - 1)

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

    def create_auth_token(self, username: str, password: str) -> Optional[str]:
        """
        Call HMIS GraphQL API and encrypt and store HMIS auth token on session.
        Returns None on failure. Does NOT verify JWT signature; for UI/expiry only.
        """

        query = """
            mutation CreateAuthToken($username: String, $password: String) {
                createAuthToken(username: $username, password: $password) { authToken }
            }
        """

        data = self._make_request(
            body={
                "query": query,
                "variables": {"username": username, "password": password},
            },
            timeout=5.0,
        )
        # GraphQL errors OR missing token → failure
        if data.get("errors"):
            return None

        token = (data.get("data", {}).get("createAuthToken") or {}).get("authToken")

        if not token:
            return None

        try:
            self._set_auth_token(token)
        except RuntimeError:
            return None

        # TODO: not this... just something like this
        return "success"

    def get_client(self, personal_id: str) -> Optional[dict[str, Any]]:
        query = self._format_query(original_query=self.request.body, expected_type="HmisClientType")

        data = self._make_request(
            body={
                "query": query,
                "variables": {"personalId": personal_id},
            }
        )

        if errors := data.get("errors"):
            return {"errors": errors}

        return data.get("data", {}).get("getClient") or {}

    def get_client_note(
        self, personal_id: strawberry.ID, enrollment_id: strawberry.ID, id: strawberry.ID
    ) -> Optional[dict[str, Any]]:
        query = self._format_query(original_query=self.request.body, expected_type="HmisClientNoteType")

        data = self._make_request(
            body={
                "query": query,
                "variables": {
                    "id": id,
                    "personalId": personal_id,
                    "enrollmentId": enrollment_id,
                },
            }
        )

        if errors := data.get("errors"):
            return {"errors": errors}

        return data.get("data", {}).get("getClientNote") or {}

    def list_clients(
        self,
        pagination: Optional[HmisPaginationInput],
        filter: Optional[HmisClientFilterInput],
    ) -> Optional[dict[str, Any]]:
        query = self._format_query(
            original_query=self.request.body, expected_type="HmisClientListType", is_list_query=True
        )

        filter_vars = {"filter": strawberry.asdict(filter)} if filter else {}
        pagination_vars = {"pagination": strawberry.asdict(pagination)} if pagination else {}

        data = self._make_request(
            body={
                "query": query,
                "variables": {**filter_vars, **pagination_vars},
            }
        )

        if errors := data.get("errors"):
            return {"errors": errors}

        return data.get("data", {}).get("listClients") or {}

    def list_client_notes(
        self,
        personal_id: strawberry.ID,
        enrollment_id: strawberry.ID,
        pagination: Optional[HmisPaginationInput],
    ) -> Optional[dict[str, Any]]:
        query = self._format_query(
            original_query=self.request.body, expected_type="HmisClientNoteListType", is_list_query=True
        )

        query = self._format_client_notes_query(query)

        pagination_vars = {"pagination": strawberry.asdict(pagination)} if pagination else {}

        data = self._make_request(
            body={
                "query": query,
                "variables": {
                    "personalId": personal_id,
                    "enrollmentId": enrollment_id,
                    **pagination_vars,
                },
            }
        )

        if errors := data.get("errors"):
            return {"errors": errors}

        return data.get("data", {}).get("listClientNotes") or {}

    def list_enrollments(
        self,
        dynamic_fields: list[Optional[str]],
        personal_id: strawberry.ID,
        pagination: Optional[HmisPaginationInput],
    ) -> Optional[dict[str, Any]]:
        query = self._format_query(
            original_query=self.request.body, expected_type="HmisEnrollmentListType", is_list_query=True
        )
        query = self._format_enrollments_query(original_query=query)

        pagination_vars = {"pagination": strawberry.asdict(pagination)} if pagination else {}

        data = self._make_request(
            body={
                "query": query,
                "variables": {
                    "dynamicFields": dynamic_fields,
                    "personalId": personal_id,
                    **pagination_vars,
                },
            }
        )

        if errors := data.get("errors"):
            return {"errors": errors}

        return data.get("data", {}).get("listEnrollments") or {}

    def create_client(
        self,
        client_input: dict[str, Any],
        client_sub_items_input: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        return self._run_client_mutation("create", client_input, client_sub_items_input)

    def update_client(
        self,
        client_input: dict[str, Any],
        client_sub_items_input: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        return self._run_client_mutation("update", client_input, client_sub_items_input)

    def create_client_note(
        self,
        client_note_input: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        return self._run_client_note_mutation("create", client_note_input)

    def update_client_note(
        self,
        client_note_input: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        return self._run_client_note_mutation("update", client_note_input)


class HmisApiRestBridge:
    """Utility class for interfacing with HMIS REST API."""

    def __init__(self, info: strawberry.Info) -> None:
        self.info = info
        self.request = self.info.context["request"]
        self.session = self.request.session

        if HMIS_REST_ENDPOINT is None or HMIS_SESSION_KEY_NAME is None or HMIS_HOST is None:
            raise Exception("HMIS not configured")

        self.endpoint = HMIS_REST_ENDPOINT
        self.schema = self._load_graphql_schema()
        self.session_key = HMIS_SESSION_KEY_NAME

        token = self._get_auth_token()
        auth_header = {"Authorization": f"Bearer {token}"} if token else {}

        self.headers = {
            "Accept": "application/json, text/plain, */*",
            "Connection": "keep-alive",
            "Host": HMIS_HOST,
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
            **auth_header,
        }

    def _load_graphql_schema(self) -> GraphQLSchema:
        obj = import_string(GRAPHQL_SCHEMA_PATH)

        return getattr(obj, "_schema", obj)  # type: ignore

    def _make_request(
        self,
        path: str,
        body: dict[str, Any],
        method: HTTPMethod = HTTPMethod.GET,
        timeout: Optional[float] = None,
    ) -> dict[str, Any]:
        request_args = {
            "url": f"{self.endpoint}{path}",
            "headers": self.headers,
            "json": body,
            "timeout": timeout,
        }

        if method is HTTPMethod.POST:
            resp = requests.post(**request_args)  # type: ignore

        else:
            resp = requests.get(**request_args)  # type: ignore

        response = resp.json() or {}

        if errors := response.get("errors"):
            if is_hmis_unauthenticated(errors):
                # TODO: destroy session here?
                raise UnauthenticatedGQLError()

        # If server replies non-JSON on error, .json() will raise — we treat as failure.
        return response

    def _fernet(self) -> Fernet:
        key = getattr(settings, "HMIS_TOKEN_KEY", None)
        if not key:
            raise RuntimeError("HMIS_TOKEN_KEY is not configured")

        return Fernet(key)

    def _set_auth_token(self, token: str) -> None:
        """"""
        decoded = jwt.decode(token, options={"verify_signature": False})
        self.session.set_expiry(decoded["exp"] - decoded["iat"] - 1)

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

    def _get_field_dot_paths(
        self,
        info: Info,
        default_fields: Optional[list[str]],
        selection_set: Optional[SelectionSetNode] = None,
    ) -> set[str]:
        """Accesses selected query fields from operation info and returns a set of dot paths.

        e.g.,
        ```
            query {
                first_name
                last_name
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

        return out

    def get_client(self, personal_id: str) -> Optional[dict[str, Any]]:
        fields = self._get_field_dot_paths(
            info=self.info,
            default_fields=["last_updated", "added_date"],
        )

        fields_str = ", ".join(fields)

        data = self._make_request(
            path=f"/clients/{personal_id}",
            body={"fields": fields_str},
        )

        if "status" in data.keys() and data["status"] == 404:
            raise ObjectDoesNotExist("The requested Client does not exist.")

        return dict_keys_to_snake(data)
