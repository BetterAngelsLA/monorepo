"""Record boundary provenance, and rename the ZIP kind (DEV-2570 / DEV-2604).

Two independent changes that share a migration because both follow from the same
audit of where our boundaries come from.

**Provenance.** ``source_url`` and ``source_vintage`` said *where* a boundary came
from, not *whose* it is. The publisher already answers that, in the ``copyrightText``
we were fetching and discarding — e.g. supervisorial districts say "maintained by the
Los Angeles County Department of Registrar-Recorder/County Clerk", SPAs say
"Department of Public Health". Those are now stored as ``source_attribution``,
alongside the ArcGIS ``serviceItemId`` that identifies the exact hosted layer.
Recording an *empty* attribution is meaningful too: the LA City council-district and
county city layers publish none, so for those the service does not evidence authority.

**ZIP kind.** The dimension is no longer a Census ZCTA. ZCTA is a statistical
approximation built from census blocks; what a caseworker means by "ZIP", and what a
geocoded street address falls in, is a postal ZIP. The source is now LA County's
parcel-based postal layer, so the kind is renamed ``zcta`` -> ``zip`` to match what
it holds. The value is stored as text, so existing rows are rewritten in place.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0003_backfill_region_pieces"),
    ]

    operations = [
        migrations.AddField(
            model_name="region",
            name="source_attribution",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="region",
            name="source_item_id",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        # The stored value changes with the label, so rewrite it before the choices
        # are narrowed, or existing ZIP rows would fall outside the new choices.
        migrations.RunSQL(
            sql="UPDATE regions_region SET kind = 'zip' WHERE kind = 'zcta';",
            reverse_sql="UPDATE regions_region SET kind = 'zcta' WHERE kind = 'zip';",
        ),
        migrations.AlterField(
            model_name="region",
            name="kind",
            field=models.CharField(
                choices=[
                    ("zip", "ZIP Code"),
                    ("city", "City"),
                    ("council_district", "City Council District"),
                    ("supervisorial_district", "Supervisorial District"),
                    ("spa", "Service Planning Area"),
                    ("coc", "Continuum of Care"),
                ],
                db_index=True,
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name="regionpiece",
            name="kind",
            field=models.CharField(
                choices=[
                    ("zip", "ZIP Code"),
                    ("city", "City"),
                    ("council_district", "City Council District"),
                    ("supervisorial_district", "Supervisorial District"),
                    ("spa", "Service Planning Area"),
                    ("coc", "Continuum of Care"),
                ],
                db_index=True,
                max_length=32,
            ),
        ),
    ]
