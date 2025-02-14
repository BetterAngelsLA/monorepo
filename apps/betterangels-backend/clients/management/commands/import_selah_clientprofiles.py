import csv
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import phonenumbers
import requests
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)
# These globals will be overwritten by command-line options.
GRAPHQL_URL: str = "http://localhost:8000/graphql"
REST_LOGIN_URL: str = "http://localhost:8000/rest-auth/login/"


def parse_source_id(source_id: str) -> float:
    """
    Convert the source_id to a numeric value.
    If it cannot be fully converted, extract the first numeric part.
    If no numeric part is found, return 0.0.
    """
    try:
        return float(source_id)
    except ValueError:
        match = re.search(r"\d+", source_id)
        if match:
            return float(match.group())
        else:
            return 0.0


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
          id
          sourceId
          sourceName
          success
          errorMessage
          createdAt
          clientProfile { id }
          rawData
        }
        ... on OperationInfo { messages { message code field kind } }
      }
    }
    """
    # Note: We hardcode the sourceName to "SELAH"
    variables = {
        "input": {
            "importJobId": import_job_id,
            "sourceId": source_id,
            "sourceName": "SELAH",
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
    headers: Dict[str, str] = {"X-CSRFToken": csrf_token, "Content-Type": "application/json"}
    payload = {"username": username, "password": password}
    response = session.post(REST_LOGIN_URL, json=payload, headers=headers)
    if response.status_code == 200:
        try:
            return response.json().get("key", "")
        except Exception:
            return ""
    elif response.status_code == 204:
        # 204 indicates success with no content.
        return ""
    return None


def map_value(
    val: str,
    mapping: Dict[str, str],
    default: Optional[str] = None,
    field: Optional[str] = None,
    source_id: Optional[str] = None,
) -> Optional[str]:
    """
    Normalize the input value by stripping and lowering it, then look it up in the mapping.
    If the value is not found, log a warning (including the field and source_id if provided)
    and return the provided default (which can be None).
    """
    v = val.strip().lower()
    if not v:
        return None
    if v not in mapping:
        msg = f"Value '{val}' not found in mapping for field '{field}'"
        if source_id:
            msg += f" (source_id: {source_id})"
        msg += f"; defaulting to {default}"
        logger.warning(msg)
    return mapping.get(v, default)


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

    # Mapping dictionaries: keys are lowercased input values; values are enum names in CAPS.
    ada_map = {
        "hearing": "HEARING",
        "mobility": "MOBILITY",
        "visual": "VISUAL",
        "other": "OTHER",
    }
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

    # Retrieve source_id from the row for warnings.
    src_id = row.get("id", "unknown")

    # Build user data.
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
            row.get("Preferred Language", ""),
            language_map,
            default=None,
            field="Preferred Language",
            source_id=src_id,
        ),
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
        parser.add_argument(
            "--graphql-url",
            default="http://localhost:8000/graphql",
            help="GraphQL endpoint URL (default: http://localhost:8000/graphql)",
        )
        parser.add_argument(
            "--rest-login-url",
            default="http://localhost:8000/rest-auth/login/",
            help="REST login endpoint URL (default: http://localhost:8000/rest-auth/login/)",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        # Override the global endpoints with the provided options.
        global GRAPHQL_URL, REST_LOGIN_URL
        GRAPHQL_URL = options["graphql_url"]
        REST_LOGIN_URL = options["rest_login_url"]

        csv_path: str = options["csv_path"]
        username: str = options["username"]
        password: str = options["password"]

        session = requests.Session()
        session.get(GRAPHQL_URL)
        self.stdout.write(f"Cookies after GET: {session.cookies.get_dict()}")

        token: Optional[str] = authenticate(session, username, password)
        if token is None:
            raise CommandError("Authentication failed. Check credentials.")

        import_job: Dict[str, Any] = create_client_profile_data_import(
            session, token, source_file=csv_path, notes="Client profile import via management command"
        )
        import_job_id: str = import_job.get("id", "")
        if not import_job_id:
            raise CommandError("No import job ID returned from GraphQL.")

        # Lists to hold report records and failed rows.
        report_records: List[Dict[str, Any]] = []
        failed_rows: List[Dict[str, Any]] = []

        # Read all rows from CSV and sort them so that the highest source_id values come first.
        with open(csv_path, "r", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            csv_fieldnames = reader.fieldnames
            rows = list(reader)
            sorted_rows = sorted(rows, key=lambda row: parse_source_id(row.get("id", "0")), reverse=True)

        # Process the sorted rows.
        for i, row in enumerate(sorted_rows, start=1):
            if not any(row.values()):
                self.stdout.write(f"Skipping empty row {i}")
                continue

            # Get the source_id from the CSV row (or default to a generated value)
            source_id: str = row.get("id", f"row_{i}")
            record = {"row": i, "source_id": source_id, "target_id": "", "error_message": ""}
            try:
                input_data: Dict[str, Any] = build_input_data(row)
                result: Dict[str, Any] = import_client_profile(
                    session, token, import_job_id, source_id, row, input_data
                )
                client_profile: Optional[Dict[str, Any]] = result.get("clientProfile")
                if not client_profile:
                    raise Exception(f"Client profile not created: {result.get('errorMessage')}")
                target_id = client_profile.get("id")
                record["target_id"] = target_id
                self.stdout.write(f"Row {i} with source_id {source_id} imported as profile ID {target_id}")
            except Exception as e:
                error_msg = str(e)
                record["error_message"] = error_msg
                self.stderr.write(f"Failed row {i} (source_id: {source_id}): {error_msg}")
                failed_rows.append(row)
            report_records.append(record)

        self.stdout.write("Import job completed.")

        # Generate the import report CSV.
        report_file = "import_report.csv"
        try:
            with open(report_file, "w", newline="", encoding="utf-8") as rf:
                fieldnames = ["row", "source_id", "target_id", "error_message"]
                writer = csv.DictWriter(rf, fieldnames=fieldnames)
                writer.writeheader()
                for rec in report_records:
                    writer.writerow(rec)
            self.stdout.write(f"Import report saved to {report_file}")
        except Exception as e:
            self.stderr.write(f"Error writing report file: {e}")

        # Generate the CSV file for failed imports.
        failed_file = "failed_imports.csv"
        if failed_rows and csv_fieldnames:
            try:
                with open(failed_file, "w", newline="", encoding="utf-8") as ff:
                    writer = csv.DictWriter(ff, fieldnames=csv_fieldnames)
                    writer.writeheader()
                    for failed_row in failed_rows:
                        writer.writerow(failed_row)
                self.stdout.write(f"Failed import rows saved to {failed_file}")
            except Exception as e:
                self.stderr.write(f"Error writing failed imports file: {e}")
        else:
            self.stdout.write("No failed rows to export.")
