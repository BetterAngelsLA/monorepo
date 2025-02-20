import csv
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

import phonenumbers

# Import pytz for timezone handling
import pytz
from betterangels_backend.data_import import utils
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)

# Default URLs
GRAPHQL_URL = "http://localhost:8000/graphql"
REST_LOGIN_URL = "http://localhost:8000/rest-auth/login/"


def parse_outreach_date(date_str: str) -> Optional[str]:
    """
    Parse the Outreach Date (expected format: M/D/YYYY) and return an ISO-formatted
    datetime string localized to Pacific Time (Los Angeles) without applying further conversion.

    For example, "1/18/2025" becomes "2025-01-18T00:00:00-08:00" during standard time.
    """
    try:
        dt = datetime.strptime(date_str, "%m/%d/%Y")
        la_tz = pytz.timezone("America/Los_Angeles")
        dt_aware = la_tz.localize(dt)
        return dt_aware.isoformat()
    except Exception:
        return None


def map_route_to_team(route: str) -> Optional[str]:
    """
    Map the CSV "Route" value to a team using the enum key expected by CreateNoteInput.

    Mapping:
      - "EP - Route 1", "EP - Route 2", "EP - Route 3",
        "EPUMC - Route 1", "EPUMC - Route 3" → "ECHO_PARK_OUTREACH"
      - "HwoodCentral", "HwoodE", "HwoodN", "HwoodSSW", "HwoodW" → "HOLLYWOOD_OUTREACH"
      - "SLCC Routes 1-7" → "SILVER_LAKE_OUTREACH"
      - Other values → None
    """
    route_lower = route.strip().lower()
    if route_lower in ("ep - route 1", "ep - route 2", "ep - route 3", "epumc - route 1", "epumc - route 3"):
        return "ECHO_PARK_OUTREACH"
    elif route_lower in ("hwoodcentral", "hwoode", "hwoodn", "hwoodssw", "hwoodw"):
        return "HOLLYWOOD_OUTREACH"
    elif route_lower == "slcc routes 1-7":
        return "SILVER_LAKE_OUTREACH"
    return None


def build_interaction_data(row: Dict[str, str]) -> Dict[str, Any]:
    """
    Build the note input data for CreateNoteInput.

    Maps:
      - Lead Name → title
      - Observations → publicDetails (prepended with Lead Name if available)
      - Route → team (via map_route_to_team)
      - Outreach Date → interactedAt (ISO formatted and localized to Pacific Time)

    Returns a dictionary with camelCase keys matching your CreateNoteInput type.
    """
    lead_name = row.get("Lead Name", "").strip()
    title = lead_name if lead_name else None
    observations = row.get("Observations", "").strip()
    public_details = f"Lead Name: {lead_name}\n{observations}" if lead_name else observations
    team = map_route_to_team(row.get("Route", ""))
    interacted_at = parse_outreach_date(row.get("Outreach Date", ""))
    note_data = {
        "purpose": "",
        "team": team,
        "title": title,
        "location": None,
        "publicDetails": public_details,
        "privateDetails": "",
        "client": None,
        "isSubmitted": False,
        "interactedAt": interacted_at,
    }
    return note_data


def extract_needs(row: Dict[str, str]) -> List[Tuple[str, Optional[str]]]:
    """
    Split the CSV "Needs" field on the pipe ("|") character and map each need to a valid ServiceEnum value.

    Mapping (case-insensitive):
      - "cell phone" → "OTHER"
      - "clothing" → "CLOTHES"
      - "sleeping bag / pad / blanket" → "SLEEPING_BAG"
      - "tarp" → "TARP"
      - "tent" → "TENT"
      - "tent [do not offer; only record if request vocalized]" → "TENT"
      - "connect w/ case manager (inc. reconnecting)" → "OTHER"
      - "medical >> specify in observations" → "MEDICAL"
      - "other specific service >> specify in observations" → "OTHER"

    For needs mapping to "OTHER", returns a tuple ("OTHER", extra) where extra is taken from "Other Service" if provided.
    """
    raw_needs = row.get("Needs", "").strip()
    if not raw_needs:
        return []
    needs_list = [n.strip() for n in raw_needs.split("|") if n.strip()]
    mapping = {
        "cell phone": "OTHER",
        "clothing": "CLOTHES",
        "sleeping bag / pad / blanket": "SLEEPING_BAG",
        "tarp": "TARP",
        "tent": "TENT",
        "tent [do not offer; only record if request vocalized]": "TENT",
        "connect w/ case manager (inc. reconnecting)": "OTHER",
        "medical >> specify in observations": "MEDICAL",
        "other specific service >> specify in observations": "OTHER",
    }
    other_service_val = row.get("Other Service", "").strip()
    result: List[Tuple[str, Optional[str]]] = []
    for need in needs_list:
        lower_need = need.lower()
        if lower_need in mapping:
            service = mapping[lower_need]
            if service == "OTHER":
                extra = other_service_val if other_service_val else need
                result.append((service, extra))
            else:
                result.append((service, None))
        else:
            result.append(("OTHER", need))
    return result


def create_note_data_import(client: utils.GraphQLClient, source_file: str, notes: str) -> Dict[str, Any]:
    query = """
    mutation CreateNoteDataImport($input: CreateNoteDataImportInput!) {
      createNoteDataImport(data: $input) {
        ... on NoteDataImportType {
          id
          notes
        }
      }
    }
    """
    variables = {"input": {"sourceFile": source_file, "notes": notes}}
    result = client.request(query, variables).get("data", {}).get("createNoteDataImport", {})
    utils.check_operation_info(result)
    return result


def import_note(
    client: utils.GraphQLClient,
    import_job_id: str,
    source_id: str,
    source_name: str,
    raw_data: Dict[str, Any],
    note_input: Dict[str, Any],
) -> Dict[str, Any]:
    query = """
    mutation ImportNote($input: ImportNoteInput!) {
      importNote(data: $input) {
        ... on NoteImportRecordType {
          note {
            id
            title
          }
          success
          errorMessage
        }
      }
    }
    """
    variables = {
        "input": {
            "importJobId": import_job_id,
            "sourceId": source_id,
            "sourceName": source_name,
            "rawData": raw_data,
            "note": note_input,
        }
    }
    response = client.request(query, variables)
    logger.debug("Raw response from importNote: %s", response)
    result = response.get("data", {}).get("importNote")
    if not result:
        raise Exception(f"Import note mutation returned invalid result. Full response: {response}")
    if "note" not in result or result["note"] is None:
        raise Exception(f"Import note mutation did not return a valid note. Full result: {result}")
    return result


def create_service_request_for_note(
    client: utils.GraphQLClient, note_id: str, service: str, service_other: Optional[str] = None
) -> Dict[str, Any]:
    query = """
    mutation CreateNoteServiceRequest($input: CreateNoteServiceRequestInput!) {
      createNoteServiceRequest(data: $input) {
        ... on ServiceRequestType {
          id
          service
        }
      }
    }
    """
    input_payload = {
        "noteId": note_id,
        "service": service,
        "serviceRequestType": "REQUESTED",
    }
    if service.upper() == "OTHER" and service_other:
        input_payload["serviceOther"] = service_other
    variables = {"input": input_payload}
    result = client.request(query, variables)
    sr_result = result.get("data", {}).get("createNoteServiceRequest", {})
    if sr_result.get("messages"):
        msgs = "; ".join(f"[{msg.get('code', 'UNKNOWN')}] {msg.get('message', '')}" for msg in sr_result["messages"])
        raise Exception(f"GraphQL operation error: {msgs}")
    return sr_result


def bulk_lookup_client_ids(client: utils.GraphQLClient, parent_ids: Set[str]) -> Dict[str, str]:
    query = """
    query BulkLookupClient($source: String!, $sourceIds: [String!]!) {
      clientProfileImportRecordsBulk(source: $source, sourceIds: $sourceIds) {
        sourceId
        clientProfile {
          id
        }
      }
    }
    """
    variables = {"source": "SELAH", "sourceIds": list(parent_ids)}
    result = client.request(query, variables)
    records = result.get("data", {}).get("clientProfileImportRecordsBulk", [])
    mapping = {
        record["sourceId"]: record["clientProfile"]["id"]
        for record in records
        if record.get("clientProfile") and record["clientProfile"].get("id")
    }
    return mapping


class Command(BaseCommand):
    help = "Import note interactions from an Outreach Engagement CSV using GraphQL mutations with bulk client lookup."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("csv_path", type=str, help="Path to the Outreach Engagement CSV file.")
        parser.add_argument(
            "--login-url", default=REST_LOGIN_URL, help=f"URL for REST auth login (default: {REST_LOGIN_URL})"
        )
        parser.add_argument("--graphql-url", default=GRAPHQL_URL, help=f"GraphQL endpoint URL (default: {GRAPHQL_URL})")
        parser.add_argument("--username", required=True, help="Username for REST auth login.")
        parser.add_argument("--password", required=True, help="Password for REST auth login.")
        parser.add_argument("--organization-id", help="Organization ID to set on imported notes.")

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path: str = options["csv_path"]
        login_url: str = options["login_url"]
        graphql_url: str = options["graphql_url"]
        username: str = options["username"]
        password: str = options["password"]
        org_id: Optional[str] = options.get("organization-id")

        try:
            client = utils.GraphQLClient(login_url, graphql_url, username, password)
        except Exception as e:
            raise CommandError(f"Authentication failed: {e}")

        self.stdout.write(f"Authenticated client ready. Cookies: {client.session.cookies.get_dict()}")

        try:
            note_import_job = create_note_data_import(client, csv_path, "Note import via management command")
        except Exception as e:
            raise CommandError(f"Failed to create note import job: {e}")
        import_job_id = note_import_job.get("id", "")
        if not import_job_id:
            raise CommandError("No note import job ID returned from GraphQL.")

        # Gather unique parent_ids from CSV rows.
        rows, csv_fieldnames = utils.read_csv_file(csv_path)
        sorted_rows = utils.sort_csv_rows(rows)
        unique_parent_ids: Set[str] = {
            row.get("parent_id", "").strip() for row in sorted_rows if row.get("parent_id", "").strip()
        }
        client_mapping = {}
        if unique_parent_ids:
            try:
                client_mapping = bulk_lookup_client_ids(client, unique_parent_ids)
                self.stdout.write(
                    f"Bulk client lookup complete. Found {len(client_mapping)} mappings out of {len(unique_parent_ids)} IDs."
                )
            except Exception as e:
                raise CommandError(f"Bulk client lookup failed: {e}")

        report_records: List[Dict[str, Any]] = []
        failed_rows: List[Dict[str, Any]] = []

        for i, row in enumerate(sorted_rows, start=1):
            if not any(row.values()):
                self.stdout.write(f"Skipping empty row {i}")
                continue

            source_id = row.get("id", f"row_{i}")
            source_name = row.get("Source Name", "").strip() or "SELAH"
            record = {"row": i, "source_id": source_id, "note_id": "", "error_message": ""}

            try:
                note_input = build_interaction_data(row)
                parent_id = row.get("parent_id", "").strip()
                if not parent_id:
                    raise Exception("Missing parent_id for client lookup.")
                client_id = client_mapping.get(parent_id)
                if not client_id:
                    raise Exception(f"No client mapping found for parent_id '{parent_id}'")
                note_input["client"] = client_id
                if org_id:
                    note_input["organization"] = org_id

                note_result = import_note(client, import_job_id, source_id, source_name, row, note_input)
                note_data = note_result.get("note")
                if note_data is None or "id" not in note_data:
                    raise Exception(f"Import note mutation did not return a valid note. Full result: {note_result}")
                note_id = note_data.get("id", "")
                if not note_id:
                    raise Exception("No note ID returned from GraphQL import mutation.")
                record["note_id"] = note_id
                self.stdout.write(f"Row {i} (source_id: {source_id}) imported as Note ID {note_id}")

                # Process all needs from the row and create a service request for each.
                needs = extract_needs(row)
                for service, service_other in needs:
                    sr_result = create_service_request_for_note(client, note_id, service, service_other)
                    self.stdout.write(
                        f"  → Added requested service '{sr_result.get('service')}' (ID {sr_result.get('id')})"
                    )
            except Exception as e:
                record["error_message"] = str(e)
                self.stderr.write(f"Failed row {i} (source_id: {source_id}): {record['error_message']}")
                failed_rows.append(row)
            report_records.append(record)

        self.stdout.write("Note import job completed.")

        report_file = "note_import_report.csv"
        try:
            with open(report_file, "w", newline="", encoding="utf-8") as rf:
                writer = csv.DictWriter(rf, fieldnames=["row", "source_id", "note_id", "error_message"])
                writer.writeheader()
                writer.writerows(report_records)
            self.stdout.write(f"Import report saved to {report_file}")
        except Exception as e:
            self.stderr.write(f"Error writing report file: {e}")

        failed_file = "failed_note_imports.csv"
        if failed_rows and csv_fieldnames:
            try:
                with open(failed_file, "w", newline="", encoding="utf-8") as ff:
                    writer = csv.DictWriter(ff, fieldnames=csv_fieldnames)
                    writer.writeheader()
                    writer.writerows(failed_rows)
                self.stdout.write(f"Failed rows saved to {failed_file}")
            except Exception as e:
                self.stderr.write(f"Error writing failed imports file: {e}")
        else:
            self.stdout.write("No failed rows to export.")
