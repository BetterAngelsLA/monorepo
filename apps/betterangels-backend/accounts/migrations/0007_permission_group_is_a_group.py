"""Make ``PermissionGroup`` a subclass of ``auth.Group`` instead of pointing at one.

The row and the group have always been one thing with two identities, kept in
step by a ``post_delete`` receiver.  Inheritance makes it structural: the group
becomes the parent, so every delete Django performs — direct, queryset, or an
organization cascade — takes it and the object-level permissions hanging off it.

No data moves.  ``auth_group.name`` already holds the unique
``Organization [pk] · Role`` key and ``accounts_permissiongroup.name`` already
holds the human label, so the only change to the row is which column the label
lives in.  The primary key becomes the one the table already carried as a unique
foreign key.

The autodetector cannot express a change of bases — it emits ``DeleteModel`` and
``CreateModel``, which would drop every row — so the swap is hand-written under
``SeparateDatabaseAndState``.
"""

import django.db.models.deletion
from django.db import migrations, models

SWAP_PRIMARY_KEY = """
ALTER TABLE accounts_permissiongroup DROP CONSTRAINT accounts_permissiongroup_pkey;
ALTER TABLE accounts_permissiongroup DROP COLUMN id;
ALTER TABLE accounts_permissiongroup DROP CONSTRAINT accounts_permissiongroup_group_id_key;
ALTER TABLE accounts_permissiongroup RENAME COLUMN group_id TO group_ptr_id;
ALTER TABLE accounts_permissiongroup ADD CONSTRAINT accounts_permissiongroup_pkey PRIMARY KEY (group_ptr_id);
"""

# Restores the shape, not the original ``id`` values — nothing foreign-keys to
# PermissionGroup, so no reference is left dangling by renumbering them.
RESTORE_PRIMARY_KEY = """
ALTER TABLE accounts_permissiongroup DROP CONSTRAINT accounts_permissiongroup_pkey;
ALTER TABLE accounts_permissiongroup RENAME COLUMN group_ptr_id TO group_id;
ALTER TABLE accounts_permissiongroup ADD CONSTRAINT accounts_permissiongroup_group_id_key UNIQUE (group_id);
ALTER TABLE accounts_permissiongroup ADD COLUMN id bigserial NOT NULL;
ALTER TABLE accounts_permissiongroup ADD CONSTRAINT accounts_permissiongroup_pkey PRIMARY KEY (id);
"""


class Migration(migrations.Migration):
    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("organizations", "0001_initial"),
        ("accounts", "0006_permission_group_has_template_or_name"),
    ]

    operations = [
        # The check names ``name``, which is about to mean something else.
        migrations.RemoveConstraint(
            model_name="permissiongroup",
            name="permission_group_has_template_or_name",
        ),
        migrations.AlterUniqueTogether(
            name="permissiongroup",
            unique_together={("organization", "template")},
        ),
        migrations.RenameField(
            model_name="permissiongroup",
            old_name="name",
            new_name="label",
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(name="PermissionGroup"),
                migrations.CreateModel(
                    name="PermissionGroup",
                    fields=[
                        (
                            "group_ptr",
                            models.OneToOneField(
                                auto_created=True,
                                on_delete=django.db.models.deletion.CASCADE,
                                parent_link=True,
                                primary_key=True,
                                serialize=False,
                                to="auth.group",
                            ),
                        ),
                        ("label", models.CharField(blank=True, max_length=255)),
                        (
                            "organization",
                            models.ForeignKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="permission_groups",
                                to="organizations.organization",
                            ),
                        ),
                        (
                            "template",
                            models.ForeignKey(
                                blank=True,
                                null=True,
                                on_delete=django.db.models.deletion.SET_NULL,
                                to="accounts.permissiongrouptemplate",
                            ),
                        ),
                    ],
                    options={"unique_together": {("organization", "template")}},
                    bases=("auth.group",),
                ),
            ],
            database_operations=[
                migrations.RunSQL(sql=SWAP_PRIMARY_KEY, reverse_sql=RESTORE_PRIMARY_KEY),
            ],
        ),
        migrations.AddConstraint(
            model_name="permissiongroup",
            constraint=models.CheckConstraint(
                condition=models.Q(template__isnull=False) | ~models.Q(label=""),
                name="permission_group_has_template_or_label",
                violation_error_message="A permission group needs either a template or a label.",
            ),
        ),
    ]
