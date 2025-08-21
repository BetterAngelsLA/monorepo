from typing import Optional

import requests
from django.conf import settings


def hmis_create_auth_token(
    username: str,
    password: str,
    *,
    url: Optional[str] = None,
    timeout: float = 5.0,
) -> Optional[str]:
    """
    Call HMIS GraphQL API and return HMISAuthToken.
    Returns None on failure. Does NOT verify JWT signature; for UI/expiry only.
    """
    endpoint = url or getattr(settings, "HMIS_GRAPHQL_URL", None)
    api_key = getattr(settings, "HMIS_API_KEY", None)
    if not endpoint or not api_key:
        return None

    query = """
    mutation CreateAuthToken($username: String, $password: String) {
      createAuthToken(username: $username, password: $password) { authToken }
    }
    """

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
    }

    try:
        resp = requests.post(
            endpoint,
            headers=headers,
            json={"query": query, "variables": {"username": username, "password": password}},
            timeout=timeout,
        )
        # If server replies non-JSON on error, .json() will raise — we treat as failure.
        data = resp.json()
    except Exception:
        return None

    # GraphQL errors OR missing token → failure
    if data.get("errors"):
        return None

    token = (data.get("data", {}).get("createAuthToken") or {}).get("authToken")
    return token
