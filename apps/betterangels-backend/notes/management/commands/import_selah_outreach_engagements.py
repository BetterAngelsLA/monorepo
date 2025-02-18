import csv
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, cast

from betterangels_backend.data_import import utils
from django.core.management.base import BaseCommand, CommandError

logger = logging.getLogger(__name__)


def parse_outreach_date(date_str: str) -> Optional[str]:
    """
    Parse the Outreach Date (expected format: M/D/YYYY) and force the time to 12 AM.
    """
    try:
        dt = datetime.strptime(date_str, "%m/%d/%Y")
        return dt.isoformat()  # Time defaults to 00:00:00.
    except Exception:
        return None


def build_interaction_data(row: Dict[str, str]) -> Dict[str, Any]:
    """
    Build the Note input data from an Outreach Engagement CSV row.

    Mappings:
      - Outreach Date → interactedAt (with time forced to 12 AM)
      - Route → team (mapped via a dictionary)
      - Lead Name → note title (since no matching user account exists)
      - Observations → publicDetails (prepended with Lead Name)
      - GEOCODE (last field) ONLY!_geolocation → location (parsed as lat/long, if provided)
    """
    outreach_date_str = row.get("Outreach Date", "").strip()
    interacted_at = parse_outreach_date(outreach_date_str)

    route = row.get("Route", "").strip().lower()
    team_mapping = {
        "ep - route 1": "echo_park_outreach",
        "ep - route 2": "echo_park_outreach",
        "ep - route 3": "echo_park_outreach",
        "epumc - route 1": "echo_park_outreach",
        "epumc - route 3": "echo_park_outreach",
        "hwoodcentral": "hollywood_outreach",
        "hwoode": "hollywood_outreach",
        "hwoodn": "hollywood_outreach",
        "hwoodssw": "hollywood_outreach",
        "hwoodw": "hollywood_outreach",
        "slcc routes 1-7": "silver_lake_outreach",
    }
    team = team_mapping.get(route, None)

    lead_name = row.get("Lead Name", "").strip()
    title = lead_name if lead_name else None

    observations = row.get("Observations", "").strip()
    public_details = f"Lead Name: {lead_name}\n{observations}" if lead_name else observations

    # Parse GEOCODE field (format: "lat, long")
    geolocation = row.get("GEOCODE (last field) ONLY!_geolocation", "").strip()
    location = None
    if geolocation:
        parts = geolocation.split(",")
        if len(parts) == 2:
            try:
                lat = float(parts[0].strip())
                lng = float(parts[1].strip())
                location = {"latitude": lat, "longitude": lng}
            except Exception as e:
                logger.warning(f"Error parsing geolocation '{geolocation}': {e}")

    note_data: Dict[str, Any] = {
        "interactedAt": interacted_at,
        "team": team,
        "title": title,
        "publicDetails": public_details,
    }
    if location:
        note_data["location"] = location
    return note_data


def extract_needs(row: Dict[str, str]) -> List[str]:
    """
    Extract and map the “Needs” field from the CSV row to corresponding service request values.

    Mappings:
      - "Cell phone" → "Other: Phone"
      - "Clothing" → "Clothes"
      - "Sleeping bag / pad / blanket" → "Sleeping Bag | Blanket"
      - "Tarp" → "Tarp"
      - "Tent" → "Tent"
      - "Connect w/ case manager (inc. reconnecting)" → "Other: Connect with case manager"
      - "Medical >> specify in Observations" → "Medical"
      - "Other specific service >> specify in Observations" → "Other"
    """
    needs_raw = row.get("Needs", "").strip()
    if not needs_raw:
        return []
    needs_list = [n.strip().lower() for n in needs_raw.split("|") if n.strip()]
    needs_mapping = {
        "cell phone": "Other: Phone",
        "clothing": "Clothes",
        "sleeping bag / pad / blanket": "Sleeping Bag | Blanket",
        "tarp": "Tarp",
        "tent": "Tent",
        "connect w/ case manager (inc. reconnecting)": "Other: Connect with case manager",
        "medical >> specify in observations": "Medical",
        "other specific service >> specify in observations": "Other",
    }
    mapped_needs = []
    for need in needs_list:
        mapped = needs_mapping.get(need)
        if not mapped:
            logger.warning(f"Need '{need}' not found in mapping; skipping")
        else:
            mapped_needs.append(mapped)
    return mapped_needs


def create_interaction(client: utils.GraphQLClient, note_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create an interaction (Note) via the createNote GraphQL mutation.
    """
    query = """
    mutation CreateNote($input: CreateNoteInput!) {
      createNote(data: $input) {
        ... on NoteType {
          id
          interactedAt
          publicDetails
          team
          title
        }
        ... on OperationInfo { messages { message code field kind } }
      }
    }
    """
    variables = {"input": note_data}
    result = client.request(query, variables)
    note_result = result.get("data", {}).get("createNote", {})
    utils.check_operation_info(note_result)
    return cast(Dict[str, Any], note_result)


def create_service_request_for_note(client: utils.GraphQLClient, note_id: str, service: str) -> Dict[str, Any]:
    """
    Create a service request (for a given Note) via the createNoteServiceRequest mutation.
    Sets service_request_type to "REQUESTED".
    """
    query = """
    mutation CreateNoteServiceRequest($input: CreateNoteServiceRequestInput!) {
      createNoteServiceRequest(data: $input) {
        ... on ServiceRequestType {
          id
          service
        }
        ... on OperationInfo { messages { message code field kind } }
      }
    }
    """
    variables = {"input": {"note": note_id, "service": service, "service_request_type": "REQUESTED"}}
    result = client.request(query, variables)
    sr_result = result.get("data", {}).get("createNoteServiceRequest", {})
    if sr_result.get("messages"):
        msgs = "; ".join(f"[{msg.get('code', 'UNKNOWN')}] {msg.get('message', '')}" for msg in sr_result["messages"])
        raise Exception(f"GraphQL operation error: {msgs}")
    return cast(Dict[str, Any], sr_result)


class Command(BaseCommand):
    help = "Import outreach interactions from an Outreach Engagement CSV."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("csv_path", type=str, help="Path to the Outreach Engagement CSV file.")
        parser.add_argument("--login-url", required=True, help="URL for REST auth login.")
        parser.add_argument("--graphql-url", required=True, help="GraphQL endpoint URL.")
        parser.add_argument("--username", required=True, help="Username for REST auth login.")
        parser.add_argument("--password", required=True, help="Password for REST auth login.")

    def handle(self, *args: Any, **options: Any) -> None:
        csv_path: str = options["csv_path"]
        login_url: str = options["login_url"]
        graphql_url: str = options["graphql_url"]
        username: str = options["username"]
        password: str = options["password"]

        try:
            client = utils.GraphQLClient(login_url, graphql_url, username, password)
        except Exception as e:
            raise CommandError(f"Authentication failed: {e}")

        self.stdout.write(f"Authenticated client ready. Cookies: {client.session.cookies.get_dict()}")

        rows, csv_fieldnames = utils.read_csv_file(csv_path)
        sorted_rows = utils.sort_csv_rows(rows)

        report_records: List[Dict[str, Any]] = []
        failed_rows: List[Dict[str, Any]] = []

        for i, row in enumerate(sorted_rows, start=1):
            source_id = row.get("id", f"row_{i}")
            record = {"row": i, "source_id": source_id, "note_id": "", "error_message": ""}
            try:
                note_input = build_interaction_data(row)
                note_result = create_interaction(client, note_input)
                note_id = note_result.get("id", "")
                if not note_id:
                    raise Exception("No note ID returned from GraphQL.")
                record["note_id"] = note_id
                self.stdout.write(f"Row {i} (source_id: {source_id}) imported as Note ID {note_id}")

                # Process Needs – create a service request for each mapped need.
                needs = extract_needs(row)
                for service in needs:
                    sr_result = create_service_request_for_note(client, note_id, service)
                    self.stdout.write(
                        f"  → Added requested service '{sr_result.get('service')}' (ID {sr_result.get('id')})"
                    )
            except Exception as e:
                error_msg = str(e)
                record["error_message"] = error_msg
                self.stderr.write(f"Failed row {i} (source_id: {source_id}): {error_msg}")
                failed_rows.append(row)
            report_records.append(record)

        self.stdout.write("Import job completed.")

        # Write the import report CSV.
        report_file = "interaction_import_report.csv"
        try:
            with open(report_file, "w", newline="", encoding="utf-8") as rf:
                fieldnames = ["row", "source_id", "note_id", "error_message"]
                writer = csv.DictWriter(rf, fieldnames=fieldnames)
                writer.writeheader()
                for rec in report_records:
                    writer.writerow(rec)
            self.stdout.write(f"Import report saved to {report_file}")
        except Exception as e:
            self.stderr.write(f"Error writing report file: {e}")

        # Write the CSV file for failed imports.
        failed_file = "failed_interactions.csv"
        if failed_rows and csv_fieldnames:
            try:
                with open(failed_file, "w", newline="", encoding="utf-8") as ff:
                    writer = csv.DictWriter(ff, fieldnames=csv_fieldnames)
                    writer.writeheader()
                    for failed_row in failed_rows:
                        writer.writerow(failed_row)
                self.stdout.write(f"Failed rows saved to {failed_file}")
            except Exception as e:
                self.stderr.write(f"Error writing failed imports file: {e}")
        else:
            self.stdout.write("No failed rows to export.")
