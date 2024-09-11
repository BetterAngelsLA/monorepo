from typing import Any, Optional, Type

from common.utils import get_current_request
from django.contrib.auth import get_user_model
from django.db.models import Model

from .permissions import HIPAA_APPROVED

User = get_user_model()

# likely should move these routers to a different app or create one.


class AuthRouter:
    """
    A router to control all database operations on models in the
    auth and contenttypes applications.
    """

    # We need to split out any client specific stuff from accounts
    # Accounts needs to be a slim project.
    route_app_labels = {"auth", "accounts", "contenttypes", "organizations"}

    def db_for_read(self, model: Type[Model], **hints: Any) -> Optional[str]:
        """
        Attempts to read auth and contenttypes models go to auth_db.
        """
        if model._meta.app_label in self.route_app_labels or model == User:
            return "default"
        return None

    def db_for_write(self, model: Type[Model], **hints: Any) -> Optional[str]:
        """
        Attempts to write auth and contenttypes models go to auth_db.
        """
        if model._meta.app_label in self.route_app_labels or model == User:
            return "default"
        return None

    def allow_relation(self, obj1: Model, obj2: Model, **hints: Any) -> Optional[bool]:
        """
        Allow relations if a model in the auth or contenttypes apps is
        involved.
        """
        if obj1._meta.app_label in self.route_app_labels or obj2._meta.app_label in self.route_app_labels:
            return True
        return None

    def allow_migrate(self, db: str, app_label: str, model_name: Optional[str] = None, **hints: Any) -> Optional[bool]:
        """
        Make sure the auth and contenttypes apps only appear in the
        'default' database.
        """
        if app_label in self.route_app_labels:
            return db == "default"
        return None


# We should convert this to a demo account router.
class HIPAADatabaseRouter:
    """
    A Django database router that routes database operations to either the default database
    or the HIPAA-compliant database based on user permissions. Users with the HIPAA-approved
    permission will have their database reads and writes routed to the 'hipaa_db' database.
    """

    def db_for_read(self, model: Model, **hints: Any) -> Optional[str]:
        request = get_current_request()
        user = getattr(request, "user", None)
        if user and user.has_perm(HIPAA_APPROVED):
            return "hipaa_db"
        return "default"

    def db_for_write(self, model: Model, **hints: Any) -> Optional[str]:
        request = get_current_request()
        user = getattr(request, "user", None)
        if user and user.has_perm(HIPAA_APPROVED):
            return "hipaa_db"
        return "default"

    def allow_relation(self, obj1: Model, obj2: Model, **hints: Any) -> bool:
        return True

    def allow_migrate(self, db: str, app_label: str, model_name: Optional[str] = None, **hints: Any) -> bool:
        return True
