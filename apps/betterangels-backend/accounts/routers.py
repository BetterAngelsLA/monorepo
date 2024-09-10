from typing import Any, Optional

from django.db.models import Model

from .permissions import HIPAA_APPROVED


class HIPAADatabaseRouter:
    """
    A Django database router that routes database operations to either the default database
    or the HIPAA-compliant database based on user permissions. Users with the HIPAA-approved
    permission will have their database reads and writes routed to the 'hipaa_db' database.
    """

    def db_for_read(self, model: Model, **hints: Any) -> Optional[str]:
        user = hints.get("user")
        if user and user.has_perm(HIPAA_APPROVED):
            return "hipaa_db"
        return "default"

    def db_for_write(self, model: Model, **hints: Any) -> Optional[str]:
        user = hints.get("user")
        if user and user.has_perm(HIPAA_APPROVED):
            return "hipaa_db"
        return "default"

    def allow_relation(self, obj1: Model, obj2: Model, **hints: Any) -> bool:
        return True

    def allow_migrate(self, db: str, app_label: str, model_name: Optional[str] = None, **hints: Any) -> bool:
        return True
