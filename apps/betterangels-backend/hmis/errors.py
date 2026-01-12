import json
from typing import Any, List, Optional, TypedDict


class HmisErrorLocation(TypedDict, total=False):
    line: Optional[int]
    column: Optional[int]
    sourceName: Optional[str]


class HmisError(TypedDict, total=False):
    path: Optional[List[str]]
    data: Optional[Any]
    errorType: Optional[str]
    errorInfo: Optional[Any]
    locations: Optional[List[HmisErrorLocation]]
    message: Optional[str]


def parse_hmis_errors(errors: Any) -> List[HmisError]:
    """
    Normalize upstream errors into a list[HmisError].
    Returns [] if not a list of dicts.
    """
    if not isinstance(errors, list):
        return []

    parsed: List[HmisError] = []

    for e in errors:
        if not isinstance(e, dict):
            continue

        parsed.append(
            {
                "path": e.get("path"),
                "data": e.get("data"),
                "errorType": e.get("errorType"),
                "errorInfo": e.get("errorInfo"),
                "locations": e.get("locations"),
                "message": e.get("message"),
            }
        )
    return parsed


def is_hmis_unauthenticated(errors: Any) -> bool:
    """
    Check if upstream errors contain an unauthenticated / 401 error.
    """
    for err in parse_hmis_errors(errors):
        error_type = (err.get("errorType") or "").strip()
        status = None

        raw_msg = err.get("message")

        if isinstance(raw_msg, str):
            try:
                payload = json.loads(raw_msg)
                status = payload.get("status")
            except Exception:
                pass

        if error_type == "401" or status == 401:
            return True

    return False
