"""Require a template or a name on every permission group, for every writer.

``PermissionGroup.clean()`` already says a row needs one or the other, but
``clean()`` only runs through a ModelForm.  ``objects.create()`` and the
``get_or_create`` in :func:`accounts.services.reconcile_org_groups` bypass it, so
the rule was true of the admin and of nothing else.  A row with neither leaves its
``auth.Group`` named ``<organization> [<pk>] · `` — an empty role segment, which
collides with the next such row on the unique ``auth.Group.name``.

Nothing creates one today: the admin inline is the only hand-written path and it
validates, while reconcile always supplies a template.  The check is added anyway
because that is what makes the rule hold for writers this code does not own —
``bulk_create``, ``loaddata``, the shell.

Rows that already violate it cannot be resolved from evidence the way
``0004``'s could: a row with neither field has nothing left that says which role
it was meant to be.  So this reports them and stops, rather than guessing a name
or deleting a row that may still grant access.
"""

from django.db import migrations, models


def reject_unidentified_permission_groups(apps, schema_editor):
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")

    unidentified = list(
        PermissionGroup.objects.filter(template__isnull=True, name="").values_list("pk", "organization__name")
    )
    if unidentified:
        listed = ", ".join(f"pk={pk} ({organization})" for pk, organization in unidentified)
        raise RuntimeError(
            "These permission groups have neither a template nor a name, so the role they grant "
            f"cannot be identified: {listed}. Give each one a name or a template, or delete it, "
            "then re-run this migration."
        )


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0005_deterministic_permission_group_names"),
    ]

    operations = [
        migrations.RunPython(reject_unidentified_permission_groups, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="permissiongroup",
            constraint=models.CheckConstraint(
                condition=models.Q(template__isnull=False) | ~models.Q(name=""),
                name="permission_group_has_template_or_name",
                violation_error_message="A permission group needs either a template or a name.",
            ),
        ),
    ]
