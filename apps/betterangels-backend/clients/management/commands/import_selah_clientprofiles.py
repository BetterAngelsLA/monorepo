import csv
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, cast

import requests
from clients.models import ProfileDataImport, ProfileImportRecord
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)

# Endpoints
GRAPHQL_URL: str = "http://localhost:8000/graphql"  # Adjust as needed
REST_LOGIN_URL: str = "http://localhost:8000/rest-auth/login/"

# ---------------------------------------------------------------------
# Helper functions for data transformations and enum normalization
# ---------------------------------------------------------------------

# Gender mapping: Convert CSV (case‐insensitive) to GraphQL enum value.
GENDER_MAP: Dict[str, str] = {
    "cisgender male": "MALE",
    "male": "MALE",
    "cisgender female": "FEMALE",
    "female": "FEMALE",
    "non-binary": "NON_BINARY",
    "transgender male": "MALE",  # adjust as needed
    "transgender female": "FEMALE",  # adjust as needed
    # Add any additional mappings if required.
}


# Hair color mapping: Map CSV variants to allowed enum keys.
def map_hair_color(val: str) -> Optional[str]:
    val = val.strip().lower()
    if not val:
        return None
    mapping = {
        "dark brown": "BROWN",
        "light brown": "BROWN",
        "salt/pepper": "BROWN",
        "black": "BLACK",
        "blonde": "BLONDE",
        "gray": "GRAY",
        "grey": "GRAY",
        "red": "RED",
        "white": "WHITE",
        "bald": "BALD",
        "other": "OTHER",
        # You may add additional variants (for example, "auburn" if needed)
    }
    return mapping.get(val, val.upper())


# Race mapping: Map CSV (after lowercasing and trimming) to GraphQL enum value.
RACE_MAP: Dict[str, str] = {
    "white": "WHITE_CAUCASIAN",
    "black / african-american": "BLACK_AFRICAN_AMERICAN",
    "hispanic / latino": "HISPANIC_LATINO",
    "asian": "ASIAN",
    "multi-racial / other": "OTHER",
    # If your CSV sometimes uses "native hawaiian/pacific islander", add it:
    "native hawaiian/pacific islander": "NATIVE_HAWAIIAN_PACIFIC_ISLANDER",
}


def map_language(val: str) -> Optional[str]:
    # Convert CSV value to uppercase to match GraphQL enum (e.g., "English" -> "ENGLISH")
    val = val.strip().upper()
    return val if val else None


def parse_date(date_str: str) -> Optional[str]:
    try:
        dt: datetime = datetime.strptime(date_str, "%m/%d/%Y")
        return dt.date().isoformat()
    except Exception:
        return None


def convert_height(height_str: str) -> Optional[int]:
    if not height_str:
        return None
    try:
        if "'" in height_str:
            parts = height_str.replace('"', "").split("'")
            feet: int = int(parts[0].strip())
            inches: int = int(parts[1].strip()) if len(parts) > 1 and parts[1].strip().isdigit() else 0
            return feet * 12 + inches
        else:
            return int(height_str)
    except Exception:
        return None


# ---------------------------------------------------------------------
# Management Command with REST Auth and CSRF Handling
# ---------------------------------------------------------------------


class Command(BaseCommand):
    help: str = "Import client profiles from a CSV file via GraphQL and track each imported profile."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("csv_path", type=str, help="Path to the CSV file.")
        parser.add_argument("--username", required=True, help="Username for REST auth login.")
        parser.add_argument("--password", required=True, help="Password for REST auth login.")

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path: str = options["csv_path"]
        username: str = options["username"]
        password: str = options["password"]

        # Create a session to persist cookies (including CSRF)
        self.session = requests.Session()
        # GET the GraphQL URL to trigger CSRF cookie generation
        get_response = self.session.get(GRAPHQL_URL)
        self.stdout.write(f"Cookies after GET: {self.session.cookies.get_dict()}")

        token: Optional[str] = self.authenticate(username, password)
        if token is None:
            raise CommandError("Authentication failed. Please check your credentials.")

        User = get_user_model()
        try:
            user_instance = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"User '{username}' does not exist.")

        import_job: ProfileDataImport = ProfileDataImport.objects.create(
            source_file=csv_path,
            imported_by=user_instance,
            notes="Client profile import via management command (REST auth login)",
        )

        row_count: int = 0
        with open(csv_path, "r", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                row_count += 1
                source_id: str = row.get("id", f"row_{row_count}")
                try:
                    input_data: Dict[str, Any] = self.build_input_data(row)
                    result: Dict[str, Any] = self.create_client_profile(input_data, token)
                    if "errors" in result:
                        error_msg: str = json.dumps(result["errors"])
                        raise Exception(f"GraphQL errors: {error_msg}")
                    # Extract profile data from the inline fragment.
                    profile_data: Dict[str, Any] = result.get("data", {}).get("createClientProfile", {})
                    if not profile_data or "id" not in profile_data:
                        raise Exception("No profile ID returned from GraphQL.")
                    client_profile_id: str = profile_data["id"]

                    ProfileImportRecord.objects.create(
                        import_job=import_job,
                        source_id=source_id,
                        client_profile_id=client_profile_id,
                        raw_data=row,
                        success=True,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Row {row_count} imported as profile ID {client_profile_id}"))
                except Exception as e:
                    ProfileImportRecord.objects.create(
                        import_job=import_job,
                        source_id=source_id,
                        raw_data=row,
                        success=False,
                        error_message=str(e),
                    )
                    self.stderr.write(self.style.ERROR(f"Failed row {row_count} (source_id: {source_id}): {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Import job completed."))

    def authenticate(self, username: str, password: str) -> Optional[str]:
        """
        Call the REST auth login endpoint and return the token.
        We assume the endpoint expects JSON with "username" and "password"
        and returns a token under "key". If a 204 is returned, we assume session auth.
        """
        csrf_token: str = self.session.cookies.get("csrftoken", "")
        self.stdout.write(f"Using CSRF token: {csrf_token}")
        headers: Dict[str, str] = {"X-CSRFToken": csrf_token, "Content-Type": "application/json"}
        payload: Dict[str, Any] = {"username": username, "password": password}
        response = self.session.post(REST_LOGIN_URL, json=payload, headers=headers)
        self.stdout.write(f"REST login response status: {response.status_code}")
        self.stdout.write(f"REST login response text: {response.text}")
        if response.status_code in (200, 204):
            try:
                data: Dict[str, Any] = response.json()
                token: Optional[str] = data.get("key")
                return token
            except ValueError:
                return ""
        return None

    def create_client_profile(self, input_data: Dict[str, Any], token: str) -> Dict[str, Any]:
        """
        Call the GraphQL mutation to create a client profile.
        Uses the session (which preserves cookies) so that CSRF and cookies persist.
        Uses an inline fragment to retrieve fields from ClientProfileType.
        """
        mutation: str = """
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
        csrf_token: str = self.session.cookies.get("csrftoken", "")
        headers: Dict[str, str] = {"X-CSRFToken": csrf_token, "Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        response = self.session.post(
            GRAPHQL_URL,
            json={"query": mutation, "variables": {"input": input_data}},
            headers=headers,
        )
        if response.status_code == 200:
            return cast(Dict[str, Any], response.json())
        else:
            raise Exception(f"GraphQL request failed with status {response.status_code}: {response.text}")

    def build_input_data(self, row: Dict[str, str]) -> Dict[str, Any]:
        """
        Build a dictionary matching your GraphQL CreateClientProfileInput type.
        Enum fields are normalized using helper functions.
        """
        input_data: Dict[str, Any] = {
            "nickname": row.get("Nickname(s) / common-use name(s)", "").strip(),
            "dateOfBirth": None,
            "user": {
                "firstName": row.get("Name (PLS READ TOOLTIP)_first", "").strip(),
                "middleName": row.get("Name (PLS READ TOOLTIP)_middle", "").strip(),
                "lastName": row.get("Name (PLS READ TOOLTIP)_last", "").strip(),
                "email": row.get("Email", "").strip().lower() or None,
            },
            "placeOfBirth": row.get("Place of Birth", "").strip() or None,
            "phoneNumbers": [],
            "livingSituation": None,
            "importantNotes": row.get("Engagement Tips / Triggers", "").strip() or None,
            "heightInInches": None,
            "hairColor": None,
            "eyeColor": None,
            "physicalDescription": row.get("Distinguishing Marks & Description", "").strip() or None,
            "gender": None,
            "adaAccommodation": None,  # Adjust if needed
            "race": None,
            "preferredLanguage": None,
            "veteranStatus": None,
        }

        # Date of Birth
        dob_str: str = row.get("Date of Birth", "").strip()
        input_data["dateOfBirth"] = parse_date(dob_str)

        # Phone Number from "Cell Phone"
        cell_phone: str = row.get("Cell Phone", "").strip()
        if cell_phone:
            input_data["phoneNumbers"].append({"number": cell_phone, "isPrimary": True})

        # Living Situation: if "Vehicle dweller?" equals "Yes"
        vehicle_dweller: str = row.get("Vehicle dweller?", "").strip().lower()
        if vehicle_dweller == "yes":
            input_data["livingSituation"] = "VEHICLE"

        # Height conversion
        height_str: str = row.get("Height", "").strip()
        input_data["heightInInches"] = convert_height(height_str)

        # Hair Color mapping
        hair_color: str = row.get("Hair Color", "").strip()
        if hair_color:
            input_data["hairColor"] = map_hair_color(hair_color)

        # Eye Color: Convert to uppercase (e.g., "brown" -> "BROWN")
        eye_color: str = row.get("Eye Color", "").strip()
        if eye_color:
            input_data["eyeColor"] = eye_color.strip().upper()

        # Gender mapping
        gender: str = row.get("Gender", "").strip()
        if gender:
            input_data["gender"] = GENDER_MAP.get(gender.lower(), gender.upper())

        # Race mapping
        race: str = row.get("Race", "").strip()
        if race:
            input_data["race"] = RACE_MAP.get(race.lower(), race.upper())

        # Preferred Language: normalize to uppercase
        preferred_language: str = row.get("Preferred Language", "").strip()
        if preferred_language:
            input_data["preferredLanguage"] = map_language(preferred_language)

        # Veteran Status: if "Veteran?" equals "Yes"
        veteran: str = row.get("Veteran?", "").strip().lower()
        input_data["veteranStatus"] = "YES" if veteran == "yes" else "NO"

        return input_data
