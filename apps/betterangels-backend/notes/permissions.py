from typing import Any

import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _
from strawberry.permission import BasePermission
from strawberry_django.auth.utils import get_current_user


class NotePermissions(models.TextChoices):
    VIEW = "notes.view_note", _("Can view note")
    CHANGE = "notes.change_note", _("Can change note")
    DELETE = "notes.delete_note", _("Can delete note")
    ADD = "notes.add_note", _("Can add note")


class PrivateDetailsPermissions(models.TextChoices):
    VIEW = "notes.view_note_private_details", _("Can view note private details")


class ServiceRequestPermissions(models.TextChoices):
    VIEW = "notes.view_service_request", _("Can view service request")
    CHANGE = "notes.change_service_request", _("Can change service request")
    DELETE = "notes.delete_service_request", _("Can delete service request")
    ADD = "notes.add_service_request", _("Can add service request")


class TaskPermissions(models.TextChoices):
    VIEW = "notes.view_task", _("Can view task")
    CHANGE = "notes.change_task", _("Can change task")
    DELETE = "notes.delete_task", _("Can delete task")
    ADD = "notes.add_task", _("Can add task")


class IsAuthenticated(BasePermission):
    message = "You must be logged in to perform this action."

    def has_permission(self, source: Any, info: strawberry.Info, **kwargs: Any) -> bool:
        user = get_current_user(info)
        if user is None or not user.is_authenticated or not user.is_active:
            return False

        return True
