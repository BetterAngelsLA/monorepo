import json
import re
from typing import Any, Optional

import jwt
import requests
import strawberry
from common.constants import HMIS_SESSION_KEY_NAME
from common.errors import UnauthenticatedGQLError
from common.utils import dict_keys_to_camel
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.http import HttpRequest
from django.utils.module_loading import import_string
from graphql import (
    GraphQLField,
    GraphQLObjectType,
    GraphQLSchema,
    parse,
    specified_rules,
    validate,
)
from graphql.type import GraphQLObjectType as _GraphQLObjectType
from hmis.errors import is_hmis_unauthenticated
from hmis.types import HmisClientFilterInput, HmisPaginationInput

HMIS_GRAPHQL_ENDPOINT = getattr(settings, "HMIS_GRAPHQL_URL", None)
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
        query = re.sub(r"\.\.\.\s+on\s+Hmis\w*Error\s*{\s*message\s*}", "", query)

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

    def _fernet(self) -> Fernet:
        key = getattr(settings, "HMIS_TOKEN_KEY", None)
        if not key:
            print("~" * 50, "not key")
            raise RuntimeError("HMIS_TOKEN_KEY is not configured")

        return Fernet(key)

    def _set_auth_token(self, token: str) -> None:
        """"""
        print("~" * 50, "set_auth_token token")
        print(token[:10])
        decoded = jwt.decode(token, options={"verify_signature": False})
        print("~" * 50, "decoded")
        print(decoded)
        print("~" * 50, "expiry initial")
        print(self.session.get_expiry_date())
        self.session.set_expiry(decoded["exp"] - decoded["iat"] - 1)
        print("~" * 50, "expiry updated")
        print(self.session.get_expiry_date())

        f = self._fernet()
        print("~" * 50, "f")
        print(f)
        self.session[self.session_key] = f.encrypt(token.encode("utf-8")).decode("utf-8")

        print("~" * 50, "self.session[self.session_key]")
        print(self.session[self.session_key])
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
        print("~" * 50, "data")
        print(data)
        # GraphQL errors OR missing token → failure
        if data.get("errors"):
            return None

        token = (data.get("data", {}).get("createAuthToken") or {}).get("authToken")

        if not token:
            print("~" * 50, "bridge not token")
            return None

        try:
            self._set_auth_token(token)
        except RuntimeError:
            print("~" * 50, "runtime error")
            return None

        # TODO: not this... just something like this
        print("~" * 50, "success")
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
