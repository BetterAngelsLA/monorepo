# betterangels_backend/logging_filters.py
import logging


class IgnoreELBHealthCheck(logging.Filter):
    """
    Skip records whose User‑Agent starts with 'ELB-HealthChecker'.
    Works for both django‑structlog (record.user_agent) and
    plain dict‑style log messages (record.msg).
    """

    def filter(self, record: logging.LogRecord) -> bool:
        ua = getattr(record, "user_agent", None)
        if ua is None and isinstance(record.msg, dict):
            ua = record.msg.get("user_agent")
        return not (ua and ua.startswith("ELB-HealthChecker"))
