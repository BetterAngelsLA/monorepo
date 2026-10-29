"""Drop ``Region.Meta.ordering``, which was ``["kind", "code"]``.

Django appends model ordering to every SELECT, which widens a bare ``.distinct()`` to
``(kind, code)`` — de-duplicating per *region* where the caller wants per *kind*.

Ordering is the caller's business, and nothing about the table changes: this only stops the
ORM adding an ORDER BY nobody asked for.
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
