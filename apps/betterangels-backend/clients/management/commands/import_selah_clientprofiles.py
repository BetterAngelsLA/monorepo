import csv
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, cast

import phonenumbers
import requests
from dateutil.relativedelta import relativedelta
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

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
    if response.status_code == 200:
        return cast(Dict[str, Any], response.json())
    raise Exception(f"GraphQL request failed with status {response.status_code}: {response.text}")


def create_client_profile_data_import(
    session: requests.Session, token: str, source_file: str, notes: str
) -> Dict[str, Any]:
    mutation = """
    mutation CreateClientProfileDataImport($input: CreateProfileDataImportInput!) {
      createClientProfileDataImport(data: $input) {
        ... on ClientProfileDataImportType {
          id
          importedAt
          sourceFile
          notes
        }
      }
    }
    """
    variables = {"input": {"sourceFile": source_file, "notes": notes}}
    return send_graphql_request(session, mutation, variables, token)


def import_client_profile(
    session: requests.Session,
    token: str,
    import_job_id: str,
    source_id: str,
    raw_data: Dict[str, Any],
    client_profile: Dict[str, Any],
) -> Dict[str, Any]:
    mutation = """
    mutation ImportClientProfile($input: ImportClientProfileInput!) {
      importClientProfile(data: $input) {
        ... on ClientProfileImportRecordType {
          id
          sourceId
          success
          errorMessage
          createdAt
          clientProfile {
              id
          }
          rawData
        }
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
    return send_graphql_request(session, mutation, variables, token)


def print_stdout(msg: str) -> None:
    print(msg)


def authenticate(session: requests.Session, username: str, password: str) -> Optional[str]:
    csrf_token = get_csrf_token(session)
    print_stdout(f"Using CSRF token: {csrf_token}")
    headers = {"X-CSRFToken": csrf_token, "Content-Type": "application/json"}
    payload = {"username": username, "password": password}
    response = session.post(REST_LOGIN_URL, json=payload, headers=headers)
    print_stdout(f"REST login response status: {response.status_code}")
    print_stdout(f"REST login response text: {response.text}")
    if response.status_code == 200:
        try:
            data = response.json()
            token = data.get("key", "")
            return token if token else ""
        except ValueError:
            return ""
    elif response.status_code == 204:
        return ""
    return None


def build_input_data(row: Dict[str, str]) -> Dict[str, Any]:
    # Transform CSV row into the input format expected by CreateClientProfileInput.
    gender_raw = (row.get("Gender") or "").strip()
    race_raw = (row.get("Race") or "").strip()
    GENDER_MAP = {
        "cisgender male": "MALE",
        "male": "MALE",
        "cisgender female": "FEMALE",
        "female": "FEMALE",
        "non-binary": "NON_BINARY",
        "transgender male": "MALE",
        "transgender female": "FEMALE",
    }
    gender_val = GENDER_MAP.get(gender_raw.lower(), gender_raw.upper()) if gender_raw else None
    if not gender_val:
        logger.warning(f"Mapping miss for gender: '{gender_raw}'. Setting value to None.")
    RACE_MAP = {
        "white": "WHITE_CAUCASIAN",
        "black / african-american": "BLACK_AFRICAN_AMERICAN",
        "hispanic / latino": "HISPANIC_LATINO",
        "asian": "ASIAN",
        "multi-racial / other": "OTHER",
        "native hawaiian / other pacific islander": "NATIVE_HAWAIIAN_PACIFIC_ISLANDER",
        "native american": "AMERICAN_INDIAN_ALASKA_NATIVE",
    }

    def map_race(val: str) -> Optional[str]:
        norm = val.strip().lower()
        if not norm:
            return None
        if norm not in RACE_MAP:
            logger.warning(f"Mapping miss for race: '{norm}'. Using '{norm.upper()}' as fallback.")
        return RACE_MAP.get(norm, norm.upper())

    race_val = map_race(race_raw) if race_raw else None
    user_data = {
        "firstName": (row.get("Name (PLS READ TOOLTIP)_first") or "").strip(),
        "middleName": (row.get("Name (PLS READ TOOLTIP)_middle") or "").strip(),
        "lastName": (row.get("Name (PLS READ TOOLTIP)_last") or "").strip(),
        "email": (row.get("Email") or "").strip().lower() or None,
    }
    if not any(user_data.values()):
        user_data = {}

    def parse_date(date_str: str) -> Optional[str]:
        try:
            dt = datetime.strptime(date_str, "%m/%d/%Y")
            return dt.date().isoformat()
        except Exception:
            return None

    def convert_height(height_str: str) -> Optional[int]:
        if not height_str:
            return None
        try:
            if "'" in height_str:
                parts = height_str.replace('"', "").split("'")
                feet = int(parts[0].strip())
                inches = int(parts[1].strip()) if len(parts) > 1 and parts[1].strip().isdigit() else 0
                return feet * 12 + inches
            return int(height_str)
        except Exception:
            return None

    def map_hair_color(val: str) -> Optional[str]:
        val = val.strip().lower()
        if not val:
            return None
        mapping = {
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
        }
        if val not in mapping:
            logger.warning(f"Mapping miss for hair color: '{val}'. Using '{val.upper()}' as fallback.")
        return mapping.get(val, val.upper())

    def map_eye_color(val: str) -> Optional[str]:
        val = val.strip().lower()
        if not val:
            return None
        mapping = {
            "blue": "BLUE",
            "brown": "BROWN",
            "black": "BROWN",
            "green": "GREEN",
            "gray": "GRAY",
            "grey": "GRAY",
            "hazel": "HAZEL",
            "other": "OTHER",
        }
        if val not in mapping:
            logger.warning(f"Mapping miss for eye color: '{val}'. Using '{val.upper()}' as fallback.")
        return mapping.get(val, val.upper())

    def map_language(val: str) -> Optional[str]:
        val = val.strip().upper()
        return val if val else None

    def is_valid_phone_number(number: str) -> bool:
        try:
            phone = phonenumbers.parse(number, "US")
            return phonenumbers.is_valid_number(phone)
        except Exception:
            return False

    data: Dict[str, Any] = {
        "nickname": (row.get("Nickname(s) / common-use name(s)") or "").strip(),
        "dateOfBirth": parse_date((row.get("Date of Birth") or "").strip()),
        "user": user_data,
        "placeOfBirth": (row.get("Place of Birth") or "").strip() or None,
        "phoneNumbers": [],
        "livingSituation": "VEHICLE" if (row.get("Vehicle dweller?") or "").strip().lower() == "yes" else None,
        "importantNotes": (row.get("Engagement Tips / Triggers") or "").strip() or None,
        "heightInInches": convert_height((row.get("Height") or "").strip()),
        "hairColor": map_hair_color((row.get("Hair Color") or "").strip()),
        "eyeColor": map_eye_color((row.get("Eye Color") or "").strip()),
        "physicalDescription": (row.get("Distinguishing Marks & Description") or "").strip() or None,
        "gender": gender_val,
        "adaAccommodation": None,
        "race": race_val,
        "preferredLanguage": map_language((row.get("Preferred Language") or "")),
        "veteranStatus": "YES" if (row.get("Veteran?") or "").strip().lower() == "yes" else "NO",
    }
    cell_phone = (row.get("Cell Phone") or "").strip()
    if cell_phone and is_valid_phone_number(cell_phone):
        data["phoneNumbers"].append({"number": cell_phone, "isPrimary": True})
    elif cell_phone:
        logger.warning(f"Skipping invalid phone number: {cell_phone}")
    return data


class Command(BaseCommand):
    help = "Import client profiles from a CSV file via GraphQL using updated endpoints."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("csv_path", type=str, help="Path to the CSV file.")
        parser.add_argument("--username", required=True, help="Username for REST auth login.")
        parser.add_argument("--password", required=True, help="Password for REST auth login.")

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path = options["csv_path"]
        username = options["username"]
        password = options["password"]

        session = requests.Session()
        session.get(GRAPHQL_URL)
        print(f"Cookies after GET: {session.cookies.get_dict()}")

        token = authenticate(session, username, password)
        if token is None:
            raise CommandError("Authentication failed. Please check your credentials.")

        UserModel = get_user_model()
        try:
            UserModel.objects.get(username=username)
        except UserModel.DoesNotExist:
            raise CommandError(f"User '{username}' does not exist.")

        import_job_response = create_client_profile_data_import(
            session,
            token,
            source_file=csv_path,
            notes="Client profile import via management command (REST auth login)",
        )
        if "errors" in import_job_response:
            raise CommandError(f"Error creating import job: {import_job_response['errors']}")
        import_job_data = import_job_response.get("data", {}).get("createClientProfileDataImport", {})
        import_job_id = import_job_data.get("id")
        if not import_job_id:
            raise CommandError("No import job ID returned from GraphQL.")

        with open(csv_path, "r", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            for i, row in enumerate(reader, start=1):
                if row is None or not any(row.values()):
                    print(f"Skipping empty row {i}")
                    continue
                source_id = row.get("id", f"row_{i}")
                try:
                    input_data = build_input_data(row)
                    result = import_client_profile(session, token, import_job_id, source_id, row, input_data)
                    if "errors" in result:
                        raise Exception(f"GraphQL errors: {json.dumps(result['errors'])}")
                    import_data = result.get("data", {}).get("importClientProfile", {})
                    if not import_data or "id" not in import_data:
                        raise Exception("No import record ID returned from GraphQL.")
                    client_profile_id = import_data.get("clientProfile", {}).get("id")
                    print(f"Row {i} imported as profile ID {client_profile_id}")
                except Exception as e:
                    print(f"Failed row {i} (source_id: {source_id}): {e}")

        print("Import job completed.")
