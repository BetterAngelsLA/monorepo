from typing import Any

from django.core.checks import Error, Tags, register


@register(Tags.models)
def check_perms_not_overridden_by_field(app_configs: Any, **kwargs: Any) -> list[Error]:
    """Ensure no model defines a database field named 'perms'.

    The ``PermissionSet`` inner class uses 'perms' as a class-level attribute.
    A database field with the same name would silently shadow it.
    """
    from django.apps import apps

    errors = []
    for model in apps.get_models():
        for field in model._meta.local_fields + model._meta.local_many_to_many:
            if field.name == "perms":
                errors.append(
                    Error(
                        f"Model '{model.__name__}' has a field named 'perms' which "
                        f"conflicts with the PermissionSet inner class.",
                        hint="Rename the field to avoid shadowing the permissions class.",
                        obj=model,
                        id="common.E001",
                    )
                )
    return errors
