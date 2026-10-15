"""Drop ``Region.Meta.ordering``.

It was ``["kind", "code"]``, which Django appends to every SELECT. That silently widened any
bare ``.distinct()`` to ``(kind, code)`` — de-duplicating per *region* where the caller wanted
per *kind* — and produced 431 scopes instead of 6 in ``ensure_location_regions``, measured at
260 s for a rebuild that should take seconds. Two call sites worked around it with
``.order_by()`` and a comment each; both are now unnecessary.

Ordering is the caller's business. Nothing about the table changes: this only stops the ORM
adding an ORDER BY nobody asked for.
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0002_alter_region_geom_display"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="region",
            options={},
        ),
    ]
