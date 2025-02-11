import csv
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import phonenumbers
import requests
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)
GRAPHQL_URL: str = "http://localhost:8000/graphql"
REST_LOGIN_URL: str = "http://localhost:8000/rest-auth/login/"


def get_csrf_token(session: requests.Session) -> str:
    return session.cookies.get("csrftoken", "")


def send_graphql_request(
    session: requests.Session, query: str, variables: Dict[str, Any], token: Optional[str] = None
) -> Dict[str, Any]:
    headers: Dict[str, str] = {
        "X-CSRFToken": get_csrf_token(session),
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = session.post(GRAPHQL_URL, json={"query": query, "variables": variables}, headers=headers)
    if response.status_code != 200:
        raise Exception(f"GraphQL request failed with status {response.status_code}: {response.text}")
    data: Dict[str, Any] = response.json()  # type: ignore
    if "errors" in data:
        msgs = "; ".join(error.get("message", "Unknown error") for error in data["errors"])
        raise Exception(f"GraphQL errors: {msgs}")
    return data


def check_operation_info(payload: Dict[str, Any]) -> None:
    if payload.get("messages"):
        msgs = "; ".join(f"[{msg.get('code', 'UNKNOWN')}] {msg.get('message', '')}" for msg in payload["messages"])
        raise Exception(f"Operation Info error: {msgs}")


def create_client_profile_data_import(
    session: requests.Session, token: str, source_file: str, notes: str
) -> Dict[str, Any]:
    query = """
    mutation CreateClientProfileDataImport($input: CreateProfileDataImportInput!) {
      createClientProfileDataImport(data: $input) {
        ... on ClientProfileDataImportType { id importedAt sourceFile notes }
        ... on OperationInfo { messages { message code field kind } }
      }
    }
    """
    variables = {"input": {"sourceFile": source_file, "notes": notes}}
    result: Dict[str, Any] = (
        send_graphql_request(session, query, variables, token).get("data", {}).get("createClientProfileDataImport", {})
    )
    check_operation_info(result)
    return result


def import_client_profile(
    session: requests.Session,
    token: str,
    import_job_id: str,
    source_id: str,
    raw_data: Dict[str, Any],
    client_profile: Dict[str, Any],
) -> Dict[str, Any]:
    query = """
    mutation ImportClientProfile($input: ImportClientProfileInput!) {
      importClientProfile(data: $input) {
        ... on ClientProfileImportRecordType {
          id sourceId success errorMessage createdAt clientProfile { id } rawData
        }
        ... on OperationInfo { messages { message code field kind } }
      }
    }
    """
    variables = {
        "input": {
            "importJobId": import_job_id,
            "sourceId": source_id,
            "rawData": raw_data,
            "clientProfile": client_profile,
        }
    }
    result: Dict[str, Any] = (
        send_graphql_request(session, query, variables, token).get("data", {}).get("importClientProfile", {})
    )
    if result.get("messages"):
        msgs = "; ".join(f"[{msg.get('code', 'UNKNOWN')}] {msg.get('message', '')}" for msg in result["messages"])
        raise Exception(f"GraphQL operation error: {msgs}")
    if result.get("success") is False:
        raise Exception(f"Import failed: {result.get('errorMessage', 'Unknown error')}")
    return result


def authenticate(session: requests.Session, username: str, password: str) -> Optional[str]:
    csrf_token = get_csrf_token(session)
    print(f"Using CSRF token: {csrf_token}")
    headers: Dict[str, str] = {"X-CSRFToken": csrf_token, "Content-Type": "application/json"}
    payload = {"username": username, "password": password}
    response = session.post(REST_LOGIN_URL, json=payload, headers=headers)
    print(f"REST login response status: {response.status_code}")
    print(f"REST login response text: {response.text}")
    if response.status_code == 200:
        try:
            return response.json().get("key", "")
        except Exception:
            return ""
    elif response.status_code == 204:
        # 204 indicates success with no content.
        return ""
    # Return None on failure.
    return None


def build_input_data(row: Dict[str, str]) -> Dict[str, Any]:
    def parse_date(s: str) -> Optional[str]:
        try:
            return datetime.strptime(s, "%m/%d/%Y").date().isoformat()
        except Exception:
            return None

    def convert_height(s: str) -> Optional[int]:
        if "'" in s:
            parts = s.replace('"', "").split("'")
            try:
                feet = int(parts[0].strip())
                inches = int(parts[1].strip()) if len(parts) > 1 and parts[1].strip().isdigit() else 0
                return feet * 12 + inches
            except Exception:
                return None
        try:
            return int(s)
        except Exception:
            return None

    def map_value(val: str, mapping: Dict[str, str]) -> Optional[str]:
        val = val.strip().lower()
        return mapping.get(val, val.upper()) if val else None

    gender: Optional[str] = map_value(
        row.get("Gender", ""),
        {
            "cisgender male": "MALE",
            "male": "MALE",
            "cisgender female": "FEMALE",
            "female": "FEMALE",
            "non-binary": "NON_BINARY",
            "transgender male": "MALE",
            "transgender female": "FEMALE",
        },
    )
    race: Optional[str] = map_value(
        row.get("Race", ""),
        {
            "white": "WHITE_CAUCASIAN",
            "black / african-american": "BLACK_AFRICAN_AMERICAN",
            "hispanic / latino": "HISPANIC_LATINO",
            "asian": "ASIAN",
            "multi-racial / other": "OTHER",
            "native hawaiian / other pacific islander": "NATIVE_HAWAIIAN_PACIFIC_ISLANDER",
            "native american": "AMERICAN_INDIAN_ALASKA_NATIVE",
        },
    )

    user_data: Dict[str, Optional[str]] = {
        "firstName": row.get("Name (PLS READ TOOLTIP)_first", "").strip() or None,
        "middleName": row.get("Name (PLS READ TOOLTIP)_middle", "").strip() or None,
        "lastName": row.get("Name (PLS READ TOOLTIP)_last", "").strip() or None,
        "email": row.get("Email", "").strip().lower() or None,
    }
    if not any(user_data.values()):
        user_data = {}

    phone_numbers: List[Dict[str, Any]] = []
    data: Dict[str, Any] = {
        "nickname": row.get("Nickname(s) / common-use name(s)", "").strip(),
        "dateOfBirth": parse_date(row.get("Date of Birth", "").strip()),
        "user": user_data,
        "placeOfBirth": row.get("Place of Birth", "").strip() or None,
        "phoneNumbers": phone_numbers,
        "livingSituation": "VEHICLE" if row.get("Vehicle dweller?", "").strip().lower() == "yes" else None,
        "importantNotes": row.get("Engagement Tips / Triggers", "").strip() or None,
        "heightInInches": convert_height(row.get("Height", "").strip()),
        "hairColor": map_value(
            row.get("Hair Color", ""),
            {
                "brown": "BROWN",
                "dark brown": "BROWN",
                "light brown": "BROWN",
                "salt/pepper": "BROWN",
                "black": "BLACK",
                "blonde": "BLONDE",
                "gray": "GRAY",
                "grey": "GRAY",
                "auburn": "RED",
                "red": "RED",
                "white": "WHITE",
                "bald": "BALD",
                "other": "OTHER",
            },
        ),
        "eyeColor": map_value(
            row.get("Eye Color", ""),
            {
                "blue": "BLUE",
                "brown": "BROWN",
                "black": "BROWN",
                "green": "GREEN",
                "gray": "GRAY",
                "grey": "GRAY",
                "hazel": "HAZEL",
                "other": "OTHER",
            },
        ),
        "physicalDescription": row.get("Distinguishing Marks & Description", "").strip() or None,
        "gender": gender,
        "adaAccommodation": None,
        "race": race,
        "preferredLanguage": row.get("Preferred Language", "").strip().upper() or None,
        "veteranStatus": "YES" if row.get("Veteran?", "").strip().lower() == "yes" else "NO",
    }

    cell_phone: str = row.get("Cell Phone", "").strip()
    if cell_phone:
        try:
            if phonenumbers.is_valid_number(phonenumbers.parse(cell_phone, "US")):
                phone_numbers.append({"number": cell_phone, "isPrimary": True})
        except Exception:
            logger.warning(f"Invalid phone number: {cell_phone}")
    return data


class Command(BaseCommand):
    help = "Import client profiles from a CSV file via GraphQL."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("csv_path", type=str, help="Path to the CSV file.")
        parser.add_argument("--username", required=True, help="Username for REST auth login.")
        parser.add_argument("--password", required=True, help="Password for REST auth login.")

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path: str = options["csv_path"]
        username: str = options["username"]
        password: str = options["password"]

        session = requests.Session()
        session.get(GRAPHQL_URL)
        print("Cookies after GET:", session.cookies.get_dict())

        token: Optional[str] = authenticate(session, username, password)
        if token is None:
            raise CommandError("Authentication failed. Check credentials.")

        UserModel = get_user_model()
        if not UserModel.objects.filter(username=username).exists():
            raise CommandError(f"User '{username}' does not exist.")

        import_job: Dict[str, Any] = create_client_profile_data_import(
            session, token, source_file=csv_path, notes="Client profile import via management command"
        )
        import_job_id: str = import_job.get("id", "")
        if not import_job_id:
            raise CommandError("No import job ID returned from GraphQL.")

        with open(csv_path, "r", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            for i, row in enumerate(reader, start=1):
                if not any(row.values()):
                    print(f"Skipping empty row {i}")
                    continue
                source_id: str = row.get("id", f"row_{i}")
                try:
                    input_data: Dict[str, Any] = build_input_data(row)
                    result: Dict[str, Any] = import_client_profile(
                        session, token, import_job_id, source_id, row, input_data
                    )
                    client_profile: Optional[Dict[str, Any]] = result.get("clientProfile")
                    if not client_profile:
                        raise Exception(f"Client profile not created: {result.get('errorMessage')}")
                    print(f"Row {i} imported as profile ID {client_profile.get('id')}")
                except Exception as e:
                    print(f"Failed row {i} (source_id: {source_id}): {e}")
        print("Import job completed.")
