import csv
import logging
from typing import Any, Dict, List, Optional, cast

import phonenumbers
from betterangels_backend.data_import.utils import (
    GraphQLClient,
    check_operation_info,
    parse_date,
    read_csv_file,
    sort_csv_rows,
)
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)

GRAPHQL_URL = "http://localhost:8000/graphql"
REST_LOGIN_URL = "http://localhost:8000/rest-auth/login/"


def create_client_profile_data_import(client: GraphQLClient, source_file: str, notes: str) -> Dict[str, Any]:
    query = """
    mutation CreateClientProfileDataImport($input: CreateProfileDataImportInput!) {
      createClientProfileDataImport(data: $input) {
        ... on ClientProfileDataImportType { id importedAt sourceFile notes }
        ... on OperationInfo { messages { message code field kind } }
      }
    }
    """
    variables = {"input": {"sourceFile": source_file, "notes": notes}}
    result = cast(
        Dict[str, Any], client.request(query, variables).get("data", {}).get("createClientProfileDataImport", {})
    )
    check_operation_info(result)
    return result


def import_client_profile(
    client: GraphQLClient,
    import_job_id: str,
    source_id: str,
    raw_data: Dict[str, Any],
    client_profile: Dict[str, Any],
) -> Dict[str, Any]:
    query = """
    mutation ImportClientProfile($input: ImportClientProfileInput!) {
      importClientProfile(data: $input) {
        ... on ClientProfileImportRecordType {
          id sourceId sourceName success errorMessage createdAt
          clientProfile { id }
          rawData
        }
        ... on OperationInfo { messages { message code field kind } }
      }
    }
    """
    variables = {
        "input": {
            "importJobId": import_job_id,
            "sourceId": source_id,
            "sourceName": "SELAH",
            "rawData": raw_data,
            "clientProfile": client_profile,
        }
    }
    result = cast(Dict[str, Any], client.request(query, variables).get("data", {}).get("importClientProfile", {}))
    if result.get("messages"):
        msgs = "; ".join(f"[{msg.get('code', 'UNKNOWN')}] {msg.get('message', '')}" for msg in result["messages"])
        raise Exception(f"GraphQL operation error: {msgs}")
    if result.get("success") is False:
        raise Exception(f"Import failed: {result.get('errorMessage', 'Unknown error')}")
    return result


def build_input_data(row: Dict[str, str]) -> Dict[str, Any]:
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

    # Mapping dictionaries
    ada_map = {"hearing": "HEARING", "mobility": "MOBILITY", "visual": "VISUAL", "other": "OTHER"}
    gender_map = {
        "cisgender male": "MALE",
        "male": "MALE",
        "m": "MALE",
        "cisgender female": "FEMALE",
        "female": "FEMALE",
        "f": "FEMALE",
        "non-binary": "NON_BINARY",
        "nonbinary": "NON_BINARY",
        "transgender male": "TRANS_MALE",
        "transgender female": "TRANS_FEMALE",
    }
    hair_map = {
        "black": "BLACK",
        "blonde": "BLONDE",
        "dirty blonde with streaks of brown and also unnatural colors": "BLONDE",
        "short hair bleached yellow/blonde": "BLONDE",
        "dark brown": "BROWN",
        "light brown": "BROWN",
        "light brown with gray streaks in front": "BROWN",
        "light brown, but often wearing a wig.": "BROWN",
        "brown/gray": "BROWN",
        "brown": "BROWN",
        "grey": "GRAY",
        "gray": "GRAY",
        "salt/pepper": "GRAY",
        "auburn": "RED",
        "red": "RED",
        "red - dyed": "RED",
        "white": "WHITE",
        "bald": "BALD",
    }
    language_map = {
        "arabic": "ARABIC",
        "armenian": "ARMENIAN",
        "sign lanuage": "ASL",  # Typo in the source data
        "english": "ENGLISH",
        "farsi": "FARSI",
        "french": "FRENCH",
        "indonesian": "INDONESIAN",
        "japanese": "JAPANESE",
        "khmer": "KHMER",
        "korean": "KOREAN",
        "russian": "RUSSIAN",
        "simplified chinese": "SIMPLIFIED_CHINESE",
        "spanish": "SPANISH",
        "tagalog": "TAGALOG",
        "traditional chinese": "TRADITIONAL_CHINESE",
        "vietnamese": "VIETNAMESE",
    }
    race_map = {
        "white": "WHITE_CAUCASIAN",
        "black / african-american": "BLACK_AFRICAN_AMERICAN",
        "hispanic / latino": "HISPANIC_LATINO",
        "asian": "ASIAN",
        "multi-racial / other": "OTHER",
        "native hawaiian / other pacific islander": "NATIVE_HAWAIIAN_PACIFIC_ISLANDER",
        "native american": "AMERICAN_INDIAN_ALASKA_NATIVE",
    }
    eye_color_map = {
        "blue": "BLUE",
        "brown": "BROWN",
        "black": "BROWN",
        "green": "GREEN",
        "gray": "GRAY",
        "grey": "GRAY",
        "hazel": "HAZEL",
        "other": "OTHER",
    }

    src_id = row.get("id", "unknown")
    user_data = {
        "firstName": row.get("Name (PLS READ TOOLTIP)_first", "").strip() or None,
        "middleName": row.get("Name (PLS READ TOOLTIP)_middle", "").strip() or None,
        "lastName": row.get("Name (PLS READ TOOLTIP)_last", "").strip() or None,
        "email": row.get("Email", "").strip().lower() or None,
    }
    if not any(user_data.values()):
        user_data = {}
    phone_numbers: List[Dict[str, Any]] = []
    data = {
        "nickname": row.get("Nickname(s) / common-use name(s)", "").strip(),
        "dateOfBirth": parse_date(row.get("Date of Birth", "").strip()),
        "user": user_data,
        "placeOfBirth": row.get("Place of Birth", "").strip() or None,
        "phoneNumbers": phone_numbers,
        "livingSituation": "VEHICLE" if row.get("Vehicle dweller?", "").strip().lower() == "yes" else None,
        "importantNotes": row.get("Engagement Tips / Triggers", "").strip() or None,
        "heightInInches": convert_height(row.get("Height", "").strip()),
        "hairColor": map_value(
            row.get("Hair Color", ""), hair_map, default="OTHER", field="Hair Color", source_id=src_id
        ),
        "eyeColor": map_value(
            row.get("Eye Color", ""), eye_color_map, default="OTHER", field="Eye Color", source_id=src_id
        ),
        "physicalDescription": row.get("Distinguishing Marks & Description", "").strip() or None,
        "gender": map_value(row.get("Gender", ""), gender_map, default="OTHER", field="Gender", source_id=src_id),
        "adaAccommodation": (
            [
                map_value(value, ada_map, default="OTHER", field="ADA Accommodation", source_id=src_id)
                for value in row.get("ADA accommodation?", "").split("|")
            ]
            if row.get("ADA accommodation?", "")
            else []
        ),
        "race": map_value(row.get("Race", ""), race_map, default="OTHER", field="Race", source_id=src_id),
        "preferredLanguage": map_value(
            row.get("Preferred Language", ""), language_map, default=None, field="Preferred Language", source_id=src_id
        ),
        "veteranStatus": "YES" if row.get("Veteran?", "").strip().lower() == "yes" else "NO",
    }
    cell_phone = row.get("Cell Phone", "").strip()
    if cell_phone:
        try:
            if phonenumbers.is_valid_number(phonenumbers.parse(cell_phone, "US")):
                phone_numbers.append({"number": cell_phone, "isPrimary": True})
        except Exception:
            logger.warning(f"Invalid phone number: {cell_phone}")
    return data


def map_value(
    val: str,
    mapping: Dict[str, str],
    default: Optional[str] = None,
    field: Optional[str] = None,
    source_id: Optional[str] = None,
) -> Optional[str]:
    v = val.strip().lower()
    if not v:
        return None
    if v not in mapping:
        logger.warning(
            "Value '%s' not found in mapping for field '%s'%s; defaulting to %s",
            val,
            field,
            f" (source_id: {source_id})" if source_id else "",
            default,
        )
    return mapping.get(v, default)


class Command(BaseCommand):
    help = "Import client profiles from a CSV file via GraphQL."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("csv_path", type=str, help="Path to the CSV file.")
        parser.add_argument("--username", required=True, help="Username for REST auth login.")
        parser.add_argument("--password", required=True, help="Password for REST auth login.")
        parser.add_argument("--graphql-url", default=GRAPHQL_URL, help=f"GraphQL endpoint URL (default: {GRAPHQL_URL})")
        parser.add_argument(
            "--rest-login-url", default=REST_LOGIN_URL, help=f"REST login endpoint URL (default: {REST_LOGIN_URL})"
        )

    def handle(self, *args: Any, **options: Any) -> None:
        graphql_url = options["graphql_url"]
        rest_login_url = options["rest_login_url"]
        csv_path = options["csv_path"]
        username = options["username"]
        password = options["password"]

        try:
            client = GraphQLClient(
                login_url=rest_login_url,
                graphql_url=graphql_url,
                username=username,
                password=password,
            )
        except Exception as e:
            self.stderr.write(
                "Authentication failed. Please verify:\n"
                "- Credentials are correct.\n"
                "- REST login URL is correct and accessible.\n"
                "- Login endpoint returns token under 'key' or 'token'.\n"
                "- CSRF token is correctly set (or not required).\n"
                "Test the login endpoint with curl or Postman."
            )
            raise CommandError(f"Authentication failed: {e}")

        import_job = create_client_profile_data_import(
            client, source_file=csv_path, notes="Client profile import via management command"
        )
        import_job_id = import_job.get("id", "")
        if not import_job_id:
            raise CommandError("No import job ID returned from GraphQL.")

        report_records: List[Dict[str, Any]] = []
        failed_rows: List[Dict[str, Any]] = []
        rows, csv_fieldnames = read_csv_file(csv_path)
        sorted_rows = sort_csv_rows(rows)

        for i, row in enumerate(sorted_rows, start=1):
            if not any(row.values()):
                self.stdout.write(f"Skipping empty row {i}")
                continue
            source_id = row.get("id", f"row_{i}")
            record = {"row": i, "source_id": source_id, "target_id": "", "error_message": ""}
            try:
                input_data = build_input_data(row)
                result = import_client_profile(client, import_job_id, source_id, row, input_data)
                client_profile = result.get("clientProfile")
                if not client_profile:
                    raise Exception(f"Client profile not created: {result.get('errorMessage')}")
                record["target_id"] = client_profile.get("id")
                self.stdout.write(f"Row {i} with source_id {source_id} imported as profile ID {record['target_id']}")
            except Exception as e:
                record["error_message"] = str(e)
                self.stderr.write(f"Failed row {i} (source_id: {source_id}): {record['error_message']}")
                failed_rows.append(row)
            report_records.append(record)

        self.stdout.write("Import job completed.")

        report_file = "import_report.csv"
        try:
            with open(report_file, "w", newline="", encoding="utf-8") as rf:
                writer = csv.DictWriter(rf, fieldnames=["row", "source_id", "target_id", "error_message"])
                writer.writeheader()
                writer.writerows(report_records)
            self.stdout.write(f"Import report saved to {report_file}")
        except Exception as e:
            self.stderr.write(f"Error writing report file: {e}")

        failed_file = "failed_imports.csv"
        if failed_rows and csv_fieldnames:
            try:
                with open(failed_file, "w", newline="", encoding="utf-8") as ff:
                    writer = csv.DictWriter(ff, fieldnames=csv_fieldnames)
                    writer.writeheader()
                    writer.writerows(failed_rows)
                self.stdout.write(f"Failed import rows saved to {failed_file}")
            except Exception as e:
                self.stderr.write(f"Error writing failed imports file: {e}")
        else:
            self.stdout.write("No failed rows to export.")
