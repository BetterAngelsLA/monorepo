import json
import re
from datetime import datetime, timezone
from typing import Any, Optional

import jwt
import requests
import strawberry
from common.utils import dict_keys_to_camel
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.http import HttpRequest
from hmis.types import HmisClientFilterInput, HmisPaginationInput

_SESSION_KEY = "hmis_auth_token"
HMIS_GRAPHQL_ENDPOINT = getattr(settings, "HMIS_GRAPHQL_URL", None)
HMIS_GRAPHQL_API_KEY = getattr(settings, "HMIS_API_KEY", None)


class HmisApiBridge:
    """Utility class for interfacing with HMIS GraphQL API."""

    def __init__(self, request: HttpRequest) -> None:
        self.request = request
        self.session = request.session

        if HMIS_GRAPHQL_ENDPOINT is None or HMIS_GRAPHQL_API_KEY is None:
            raise Exception("HMIS not configured")

        self.endpoint = HMIS_GRAPHQL_ENDPOINT
        self.api_key = HMIS_GRAPHQL_API_KEY

        token = self._get_auth_token()
        auth_header = {"Authorization": f"Bearer {token}"} if token else {}

        self.headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            **auth_header,
        }

    def _make_request(self, body: dict[str, Any], timeout: Optional[float] = None) -> dict[str, Any]:
        resp = requests.post(
            self.endpoint,
            headers=self.headers,
            json=body,
            timeout=timeout,
        )
        # If server replies non-JSON on error, .json() will raise — we treat as failure.
        return resp.json() or {}

    def _extract_response_body_from_mutation(
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

    def _format_query(self, original_query: bytes, is_list_query: bool = False) -> str:
        # convert from byte string
        query = json.loads(original_query.decode("utf-8"))["query"]

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
            raise RuntimeError("HMIS_TOKEN_KEY is not configured")

        return Fernet(key)

    def _set_auth_token(self, token: str) -> None:
        """"""
        decoded = jwt.decode(token, options={"verify_signature": False})
        self.session.set_expiry(decoded["exp"] - 1)

        f = self._fernet()
        self.session[_SESSION_KEY] = f.encrypt(token.encode("utf-8")).decode("utf-8")
        self.session.modified = True

    def _get_auth_token(self) -> Optional[str]:
        enc = self.session.get(_SESSION_KEY)

        if not enc:
            return None

        try:
            f = self._fernet()
            return f.decrypt(enc.encode("utf-8")).decode("utf-8")
        except (InvalidToken, ValueError):
            self._clear_auth_token()

            return None

    def _clear_auth_token(self) -> None:
        if _SESSION_KEY in self.session:
            del self.session[_SESSION_KEY]

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
        query = self._format_query(original_query=self.request.body)

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
        query = self._format_query(original_query=self.request.body, is_list_query=True)

        data = self._make_request(
            body={
                "query": query,
                "variables": {
                    "pagination": strawberry.asdict(pagination),
                    "filter": strawberry.asdict(filter),
                },
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

        mutation_body = json.loads(self.request.body.decode("utf-8"))["query"]
        payload_body = self._extract_response_body_from_mutation(mutation_body)

        mutation = f"""
            mutation (
                $clientInput: CreateClientInput!,
                $clientSubItemsInput: CreateClientSubItemsInput!
            ) {{
                createClient(
                    client: $clientInput,
                    data: $clientSubItemsInput,
                ) {{
                    {payload_body}
                }}
            }}
        """

        client_input_camel = dict_keys_to_camel(client_input)
        client_sub_items_input_camel = dict_keys_to_camel(client_sub_items_input)

        data = self._make_request(
            body={
                "query": mutation,
                "variables": {
                    "clientInput": client_input_camel,
                    "clientSubItemsInput": client_sub_items_input_camel,
                },
            }
        )

        if errors := data.get("errors"):
            return {"errors": errors}

        return data.get("data", {}).get("createClient") or {}
