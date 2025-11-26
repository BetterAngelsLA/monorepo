from typing import Any, Optional

import jwt
import requests
from common.constants import HMIS_SESSION_KEY_NAME
from common.errors import UnauthenticatedGQLError
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.http import HttpRequest
from hmis.errors import is_hmis_unauthenticated

HMIS_GRAPHQL_ENDPOINT = getattr(settings, "HMIS_GRAPHQL_URL", None)
HMIS_GRAPHQL_API_KEY = getattr(settings, "HMIS_API_KEY", None)
GRAPHQL_SCHEMA_PATH = "betterangels_backend.schema.schema"


class HmisGraphQLApiBridge:
    """Utility class for interfacing with HMIS GraphQL API."""

    def __init__(self, request: HttpRequest) -> None:
        self.request = request
        self.session = request.session

        if HMIS_GRAPHQL_ENDPOINT is None or HMIS_GRAPHQL_API_KEY is None or HMIS_SESSION_KEY_NAME is None:
            raise Exception("HMIS not configured")

        self.endpoint = HMIS_GRAPHQL_ENDPOINT
        self.api_key = HMIS_GRAPHQL_API_KEY
        self.session_key = HMIS_SESSION_KEY_NAME

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
