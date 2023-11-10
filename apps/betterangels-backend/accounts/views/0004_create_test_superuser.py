from typing import TYPE_CHECKING, Any

from django.db import migrations

if TYPE_CHECKING:
    from django.apps.registry import Apps


def create_test_superuser(apps: "Apps", _: Any) -> None:
    # TODO: need to add a gate here that bails early if the environment is not
    # Testing env. Not sure how to determine that yet.
    # Example:

    # from django.conf import settings
    # if not settings.TESTING:
    #     return

    from django.contrib.auth import get_user_model

    User = get_user_model()
    admin = User.objects.create_superuser(
        username="admin", email="admin@admin.admin", password="admin"
    )
    admin.save()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_user_date_joined_user_first_name_user_last_name_and_more"),
    ]

    operations = [migrations.RunPython(create_test_superuser)]
