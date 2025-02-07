import csv
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, cast

import phonenumbers
import requests
from clients.models import ProfileDataImport, ProfileImportRecord
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)

# Endpoints
GRAPHQL_URL: str = "http://localhost:8000/graphql"
REST_LOGIN_URL: str = "http://localhost:8000/rest-auth/login/"

# ---------------------------------------------------------------------
# Helper functions for data transformations and enum normalization
# ---------------------------------------------------------------------

GENDER_MAP: Dict[str, str] = {
    "cisgender male": "MALE",
    "male": "MALE",
    "cisgender female": "FEMALE",
    "female": "FEMALE",
    "non-binary": "NON_BINARY",
    "transgender male": "MALE",  # adjust if needed
    "transgender female": "FEMALE",  # adjust if needed
}


def is_valid_phone_number(number: str) -> bool:
    try:
        phone = phonenumbers.parse(number, "US")
        return phonenumbers.is_valid_number(phone)
    except Exception:
        return False


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


RACE_MAP: Dict[str, str] = {
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


def map_language(val: str) -> Optional[str]:
    val = val.strip().upper()
    return val if val else None


def map_eye_color(val: str) -> Optional[str]:
    """Normalize common eye-color values to the GraphQL enum keys."""
    val = val.strip().lower()
    if not val:
        return None
    mapping = {
        "blue": "BLUE",
        "brown": "BROWN",
        "black": "BROWN",  # sometimes CSV might use "black" for brown eyes
        "green": "GREEN",
        "gray": "GRAY",
        "grey": "GRAY",
        "hazel": "HAZEL",
        "other": "OTHER",
    }
    if val not in mapping:
        logger.warning(f"Mapping miss for eye color: '{val}'. Using '{val.upper()}' as fallback.")
    return mapping.get(val, val.upper())


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


# ---------------------------------------------------------------------
# Management Command with REST Auth and CSRF Handling
# ---------------------------------------------------------------------


class Command(BaseCommand):
    help = "Import client profiles from a CSV file via GraphQL and track each imported profile."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("csv_path", type=str, help="Path to the CSV file.")
        parser.add_argument("--username", required=True, help="Username for REST auth login.")
        parser.add_argument("--password", required=True, help="Password for REST auth login.")

    def get_csrf_token(self) -> str:
        return self.session.cookies.get("csrftoken", "")

    def send_graphql_request(
        self, query: str, variables: Dict[str, Any], token: Optional[str] = None
    ) -> Dict[str, Any]:
        headers: Dict[str, str] = {
            "X-CSRFToken": self.get_csrf_token(),
            "Content-Type": "application/json",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        response = self.session.post(GRAPHQL_URL, json={"query": query, "variables": variables}, headers=headers)
        if response.status_code == 200:
            return cast(Dict[str, Any], response.json())
        raise Exception(f"GraphQL request failed with status {response.status_code}: {response.text}")

    def create_client_profile(self, input_data: Dict[str, Any], token: str) -> Dict[str, Any]:
        mutation = """
        mutation CreateClientProfile($input: CreateClientProfileInput!) {
            createClientProfile(data: $input) {
                ... on ClientProfileType {
                    id
                    user {
                        id
                        email
                    }
                }
            }
        }
        """
        return self.send_graphql_request(mutation, {"input": input_data}, token)

    def build_input_data(self, row: Dict[str, str]) -> Dict[str, Any]:
        gender_raw = row.get("Gender", "").strip()
        race_raw = row.get("Race", "").strip()
        gender_val = GENDER_MAP.get(gender_raw.lower(), gender_raw.upper()) if gender_raw else None
        if not gender_val:
            logger.warning(f"Mapping miss for gender: '{gender_raw}'. Setting value to None.")
        race_val = map_race(race_raw) if race_raw else None
        if not race_val:
            logger.warning(f"Mapping miss for race: '{race_raw}'. Setting value to None.")

        data: Dict[str, Any] = {
            "nickname": row.get("Nickname(s) / common-use name(s)", "").strip(),
            "dateOfBirth": parse_date(row.get("Date of Birth", "").strip()),
            "user": {
                "firstName": row.get("Name (PLS READ TOOLTIP)_first", "").strip(),
                "middleName": row.get("Name (PLS READ TOOLTIP)_middle", "").strip(),
                "lastName": row.get("Name (PLS READ TOOLTIP)_last", "").strip(),
                "email": row.get("Email", "").strip().lower() or None,
            },
            "placeOfBirth": row.get("Place of Birth", "").strip() or None,
            "phoneNumbers": [],
            "livingSituation": "VEHICLE" if row.get("Vehicle dweller?", "").strip().lower() == "yes" else None,
            "importantNotes": row.get("Engagement Tips / Triggers", "").strip() or None,
            "heightInInches": convert_height(row.get("Height", "").strip()),
            "hairColor": map_hair_color(row.get("Hair Color", "").strip()),
            "eyeColor": map_eye_color(row.get("Eye Color", "").strip()),
            "physicalDescription": row.get("Distinguishing Marks & Description", "").strip() or None,
            "gender": gender_val,
            "adaAccommodation": None,  # Adjust if needed
            "race": race_val,
            "preferredLanguage": map_language(row.get("Preferred Language", "")),
            "veteranStatus": "YES" if row.get("Veteran?", "").strip().lower() == "yes" else "NO",
        }
        cell_phone = row.get("Cell Phone", "").strip()
        if cell_phone and is_valid_phone_number(cell_phone):
            data["phoneNumbers"].append({"number": cell_phone, "isPrimary": True})
        elif cell_phone:
            logger.warning(f"Skipping invalid phone number: {cell_phone}")
        return data

    def authenticate(self, username: str, password: str) -> Optional[str]:
        csrf_token = self.get_csrf_token()
        self.stdout.write(f"Using CSRF token: {csrf_token}")
        headers = {"X-CSRFToken": csrf_token, "Content-Type": "application/json"}
        payload = {"username": username, "password": password}
        response = self.session.post(REST_LOGIN_URL, json=payload, headers=headers)
        self.stdout.write(f"REST login response status: {response.status_code}")
        self.stdout.write(f"REST login response text: {response.text}")
        if response.status_code in (200, 204):
            try:
                data = response.json()
                return data.get("key", "")
            except ValueError:
                return ""
        return None

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path = options["csv_path"]
        username = options["username"]
        password = options["password"]

        self.session = requests.Session()
        # Trigger CSRF cookie
        self.session.get(GRAPHQL_URL)
        self.stdout.write(f"Cookies after GET: {self.session.cookies.get_dict()}")

        token = self.authenticate(username, password)
        if token is None:
            raise CommandError("Authentication failed. Please check your credentials.")

        User = get_user_model()
        try:
            user_instance = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"User '{username}' does not exist.")

        import_job = ProfileDataImport.objects.create(
            source_file=csv_path,
            imported_by=user_instance,
            notes="Client profile import via management command (REST auth login)",
        )

        with open(csv_path, "r", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            for i, row in enumerate(reader, start=1):
                source_id = row.get("id", f"row_{i}")
                # Check for a duplicate: if a record with the same source_id already exists (and was imported successfully), skip.
                if ProfileImportRecord.objects.filter(source_id=source_id, success=True).exists():
                    self.stdout.write(
                        self.style.WARNING(f"Skipping row {i} (source_id: {source_id}): already imported.")
                    )
                    continue

                try:
                    input_data = self.build_input_data(row)
                    result = self.create_client_profile(input_data, token)
                    if "errors" in result:
                        raise Exception(f"GraphQL errors: {json.dumps(result['errors'])}")
                    profile_data = result.get("data", {}).get("createClientProfile", {})
                    if not profile_data or "id" not in profile_data:
                        raise Exception("No profile ID returned from GraphQL.")
                    client_profile_id = profile_data["id"]

                    ProfileImportRecord.objects.create(
                        import_job=import_job,
                        source_id=source_id,
                        client_profile_id=client_profile_id,
                        raw_data=row,
                        success=True,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Row {i} imported as profile ID {client_profile_id}"))
                except Exception as e:
                    ProfileImportRecord.objects.create(
                        import_job=import_job,
                        source_id=source_id,
                        raw_data=row,
                        success=False,
                        error_message=str(e),
                    )
                    self.stderr.write(self.style.ERROR(f"Failed row {i} (source_id: {source_id}): {e}"))

        self.stdout.write(self.style.SUCCESS("Import job completed."))
