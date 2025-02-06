import csv
import json
import logging
from datetime import datetime

import requests
from clients.models import ProfileDataImport, ProfileImportRecord
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

logger = logging.getLogger(__name__)

# Set your GraphQL API endpoint here.
GRAPHQL_URL = "http://localhost:8000/graphql/"

# ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
# Helper functions for data transformations
# ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

GENDER_MAP = {
    "Cisgender Male": "MALE",
    "Cisgender Female": "FEMALE",
    # Add additional mappings as needed.
}
HAIR_COLOR_MAP = {
    "Black": "BLACK",
    "Brown": "BROWN",
    "Blonde": "BLONDE",
    "Gray": "GRAY",
}
RACE_MAP = {
    "White": "WHITE",
    "Black / African-American": "BLACK_AFRICAN_AMERICAN",
    "Hispanic / Latino": "HISPANIC_LATINO",
    "Asian": "ASIAN",
}


def parse_date(date_str):
    """
    Attempt to parse a date in MM/DD/YYYY format.
    Returns an ISO-format date string (YYYY-MM-DD) or None if invalid.
    """
    try:
        # Skip values like "0/0/0000"
        dt = datetime.strptime(date_str, "%m/%d/%Y")
        return dt.date().isoformat()
    except Exception:
        return None


def convert_height(height_str):
    """
    Converts a height string (e.g., "6'" or "5'11\"") into inches.
    Returns an integer (inches) or None if conversion fails.
    """
    if not height_str:
        return None
    try:
        if "'" in height_str:
            parts = height_str.replace('"', "").split("'")
            feet = int(parts[0].strip())
            inches = int(parts[1].strip()) if len(parts) > 1 and parts[1].strip().isdigit() else 0
            return feet * 12 + inches
        else:
            # If the field is already numeric (as string)
            return int(height_str)
    except Exception:
        return None


# ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
# Management Command
# ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––


class Command(BaseCommand):
    help = "Import client profiles from a CSV file via GraphQL and track each imported profile."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=str, help="Path to the CSV file.")
        parser.add_argument("--username", required=True, help="Username for GraphQL authentication.")
        parser.add_argument("--password", required=True, help="Password for GraphQL authentication.")

    def handle(self, *args, **options):
        csv_path = options["csv_path"]
        username = options["username"]
        password = options["password"]

        # Authenticate via GraphQL to obtain a JWT token
        token = self.authenticate(username, password)
        if not token:
            raise CommandError("Authentication failed. Please check your credentials.")

        # Get the Django user instance for tracking the import job.
        User = get_user_model()
        try:
            user_instance = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"User '{username}' does not exist.")

        # Create a new ProfileDataImport record for this job.
        import_job = ProfileDataImport.objects.create(
            source_file=csv_path, imported_by=user_instance, notes="Client profile import via management command"
        )

        row_count = 0
        with open(csv_path, "r", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                row_count += 1
                # Use the CSV 'id' field (or a fallback if missing) as the source_id.
                source_id = row.get("id", f"row_{row_count}")
                try:
                    input_data = self.build_input_data(row)
                    result = self.create_client_profile(input_data, token)
                    if "errors" in result:
                        error_msg = json.dumps(result["errors"])
                        raise Exception(f"GraphQL errors: {error_msg}")
                    profile_data = result.get("data", {}).get("createClientProfile", {})
                    if not profile_data or "id" not in profile_data:
                        raise Exception("No profile ID returned from GraphQL.")
                    client_profile_id = profile_data["id"]

                    # Record a successful import.
                    ProfileImportRecord.objects.create(
                        import_job=import_job,
                        source_id=source_id,
                        client_profile_id=client_profile_id,
                        raw_data=row,
                        success=True,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Row {row_count} imported as profile ID {client_profile_id}"))
                except Exception as e:
                    # Record the failed import attempt.
                    ProfileImportRecord.objects.create(
                        import_job=import_job, source_id=source_id, raw_data=row, success=False, error_message=str(e)
                    )
                    self.stderr.write(self.style.ERROR(f"Failed row {row_count} (source_id: {source_id}): {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Import job completed."))

    def authenticate(self, username, password):
        """
        Call the GraphQL login mutation and return the JWT token.
        Adjust the mutation as needed for your authentication schema.
        """
        query = """
        mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                token
            }
        }
        """
        variables = {"email": username, "password": password}
        response = requests.post(GRAPHQL_URL, json={"query": query, "variables": variables})
        if response.status_code == 200:
            data = response.json()
            token = data.get("data", {}).get("login", {}).get("token")
            return token
        return None

    def create_client_profile(self, input_data, token):
        """
        Call the GraphQL mutation to create a client profile.
        Adjust the mutation and fields as needed to match your GraphQL schema.
        """
        mutation = """
        mutation CreateClientProfile($input: CreateClientProfileInput!) {
            createClientProfile(data: $input) {
                id
                user {
                    id
                    email
                }
            }
        }
        """
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            GRAPHQL_URL, json={"query": mutation, "variables": {"input": input_data}}, headers=headers
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"GraphQL request failed with status {response.status_code}: {response.text}")

    def build_input_data(self, row):
        """
        Build a dictionary matching your GraphQL CreateClientProfileInput type.
        Maps and converts CSV fields (by header name) to the corresponding GraphQL fields.
        Adjust the keys and transformations as needed.
        """
        input_data = {
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
            "eyeColor": row.get("Eye Color", "").strip() or None,
            "physicalDescription": row.get("Distinguishing Marks & Description", "").strip() or None,
            "gender": None,
            "adaAccommodation": None,  # Adjust if you expect a list value
            "race": None,
            "preferredLanguage": row.get("Preferred Language", "").strip() or None,
            "veteranStatus": None,
        }

        # Date of Birth
        dob_str = row.get("Date of Birth", "").strip()
        input_data["dateOfBirth"] = parse_date(dob_str)

        # Phone Number from "Cell Phone"
        cell_phone = row.get("Cell Phone", "").strip()
        if cell_phone:
            input_data["phoneNumbers"].append({"number": cell_phone, "isPrimary": True})

        # Living Situation: if "Vehicle dweller?" equals "Yes" (case-insensitive), then set to VEHICLE.
        vehicle_dweller = row.get("Vehicle dweller?", "").strip().lower()
        if vehicle_dweller == "yes":
            input_data["livingSituation"] = "VEHICLE"

        # Height conversion
        height_str = row.get("Height", "").strip()
        input_data["heightInInches"] = convert_height(height_str)

        # Hair Color mapping
        hair_color = row.get("Hair Color", "").strip()
        if hair_color:
            input_data["hairColor"] = HAIR_COLOR_MAP.get(hair_color, hair_color.upper())

        # Gender mapping
        gender = row.get("Gender", "").strip()
        if gender:
            input_data["gender"] = GENDER_MAP.get(gender, "OTHER")

        # Race mapping
        race = row.get("Race", "").strip()
        if race:
            input_data["race"] = RACE_MAP.get(race, race.upper())

        # Veteran Status: if "Veteran?" equals "Yes" (case-insensitive) then set to "YES" else "NO"
        veteran = row.get("Veteran?", "").strip().lower()
        input_data["veteranStatus"] = "YES" if veteran == "yes" else "NO"

        # (Add additional field mappings as needed.)

        return input_data
