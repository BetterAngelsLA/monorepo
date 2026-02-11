from django.contrib.gis.geos import Point
from django.db import migrations

# Must match Location.GPS_PRECISION
GPS_PRECISION = 5


def round_and_deduplicate_locations(apps, schema_editor):
    """Round all Location point coordinates to GPS_PRECISION decimal places.

    After rounding, some Locations may become duplicates (same address +
    point + point_of_interest).  We keep the oldest (lowest pk), re-point
    Note / HmisNote FKs, and delete the rest.
    """
    Location = apps.get_model("common", "Location")

    # --- 1. Round all points ------------------------------------------------
    for loc in Location.objects.all():
        x = round(loc.point.x, GPS_PRECISION)
        y = round(loc.point.y, GPS_PRECISION)
        if x != loc.point.x or y != loc.point.y:
            loc.point = Point(x, y, srid=loc.point.srid)
            loc.save(update_fields=["point"])

    # --- 2. Deduplicate any newly-colliding rows ----------------------------
    from django.db.models import Count, Min

    fk_models = []
    for label in ("notes.Note", "hmis.HmisNote"):
        try:
            fk_models.append(apps.get_model(label))
        except LookupError:
            pass

    dupes = (
        Location.objects.values("address_id", "point", "point_of_interest")
        .annotate(cnt=Count("id"), keep_id=Min("id"))
        .filter(cnt__gt=1)
    )

    for group in dupes:
        keep_id = group["keep_id"]
        dup_ids = list(
            Location.objects.filter(
                address_id=group["address_id"],
                point=group["point"],
                point_of_interest=group["point_of_interest"],
            )
            .exclude(id=keep_id)
            .values_list("id", flat=True)
        )

        for model in fk_models:
            model.objects.filter(location_id__in=dup_ids).update(location_id=keep_id)

        Location.objects.filter(id__in=dup_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0020_address_functional_index"),
    ]

    operations = [
        migrations.RunPython(
            round_and_deduplicate_locations,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
