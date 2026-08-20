"""Drop ``PermissionGroupTemplate.permissions``.

The permission set for a role was stored three times: in the role's
``TemplateConfig`` in code, in this many-to-many, and on each organization's
``auth.Group``.  The middle copy had no independent reader — every read of it
belonged to a sync that had just written it from the code definition — so it is
removed and ``auth.Group.permissions`` is now populated straight from config by
:func:`accounts.seed.sync_group_permissions`.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_deterministic_permission_group_names"),
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="permissiongrouptemplate",
            name="permissions",
        ),
    ]
