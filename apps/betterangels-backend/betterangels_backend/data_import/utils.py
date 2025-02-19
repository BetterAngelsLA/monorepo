import csv
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, cast

import requests

logger = logging.getLogger(__name__)


def create_default_session() -> requests.Session:
    """
    Create a new requests Session with default headers.
    """

    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def get_csrf_token(session: requests.Session) -> str:
    return str(session.cookies.get("csrftoken", ""))


def update_dynamic_headers(session: requests.Session, url: str, token: Optional[str] = None) -> None:
    """
    Retrieve the current CSRF token from the session and update the session's headers.
    Sets the X-CSRFToken header and the Referer header (using the provided URL).
    Optionally sets the Authorization header if a token is provided.
    """
    csrf_token = get_csrf_token(session)
    session.headers["X-CSRFToken"] = csrf_token
    session.headers["Referer"] = f"{url}?csrf_token={csrf_token}"
    if token:
        session.headers["Authorization"] = f"Bearer {token}"


def authenticate(session: requests.Session, login_url: str, username: str, password: str) -> Optional[str]:
    """
     Authenticate against the login URL using the provided username and password.
    Assumes the session has been primed with cookies via an initial GET.
    """
    update_dynamic_headers(session, login_url)
    payload = {"username": username, "password": password}
    response = session.post(login_url, json=payload)
    if response.status_code == 200:
        try:
            data = response.json()
            token = data.get("key") or data.get("token")
            if token is None:
                logger.error("No token found in login response: %s", data)
            return str(token) if token is not None else None
        except Exception as ex:
            logger.exception("Error parsing JSON response: %s", ex)
            return None
    elif response.status_code == 204:
        return ""
    else:
        logger.error("Login POST returned status %s: %s", response.status_code, response.text)
    return None


class GraphQLClient:
    """
    A client that encapsulates authentication and GraphQL request logic.
    """

    def __init__(self, login_url: str, graphql_url: str, username: str, password: str):
        self.login_url = login_url
        self.graphql_url = graphql_url
        self.session = create_default_session()
        self.session.get(login_url)
        token = authenticate(self.session, login_url, username, password)
        if token is None:
            raise Exception("Authentication failed.")
        update_dynamic_headers(self.session, graphql_url, token)

    def request(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send a GraphQL request.
        Uses a None default for 'variables' to avoid mutable defaults.
        """
        if variables is None:
            variables = {}
        response = self.session.post(self.graphql_url, json={"query": query, "variables": variables})
        if response.status_code != 200:
            raise Exception(f"GraphQL request failed with status {response.status_code}: {response.text}")
        data: Dict[str, Any] = response.json()
        if "errors" in data:
            msgs = "; ".join(error.get("message", "Unknown error") for error in data["errors"])
            raise Exception(f"GraphQL errors: {msgs}")
        return data


def check_operation_info(payload: Dict[str, Any]) -> None:
    if payload.get("messages"):
        msgs = "; ".join(f"[{msg.get('code', 'UNKNOWN')}] {msg.get('message', '')}" for msg in payload["messages"])
        raise Exception(f"Operation Info error: {msgs}")


def parse_source_id(source_id: str) -> float:
    try:
        return float(source_id)
    except Exception:
        match = re.search(r"\d+", source_id)
        return float(match.group()) if match else 0.0


def sort_csv_rows(rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
    return sorted(rows, key=lambda row: parse_source_id(row.get("id", "0")), reverse=True)


def parse_date(date_str: str, fmt: str = "%m/%d/%Y") -> Optional[str]:
    try:
        dt = datetime.strptime(date_str, fmt)
        return dt.date().isoformat()
    except Exception:
        return None


def read_csv_file(csv_path: str) -> Tuple[List[Dict[str, str]], List[str]]:
    """
    Reads a CSV file and returns a tuple of:
      - A list of rows (each row is a dict with keys and values as strings)
      - A list of fieldnames.
    The rows are explicitly cast to List[Dict[str, str]] to satisfy type checking.
    """
    with open(csv_path, "r", encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        fieldnames = list(reader.fieldnames or [])
        rows = cast(List[Dict[str, str]], list(reader))
    return rows, fieldnames
