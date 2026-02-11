from django.db import migrations

# Must match Location.GPS_PRECISION
GPS_PRECISION = 5


def round_and_deduplicate_locations(apps, schema_editor):
    """Round all Location point coordinates to GPS_PRECISION decimal places.

    After rounding, some Locations may become duplicates (same address +
    point + point_of_interest).  We keep the oldest (lowest pk), re-point
    Note / HmisNote FKs, and delete the rest.
    """
    execute = schema_editor.execute

    # --- 1. Bulk-round all points in a single UPDATE -----------------------
    execute(
        """
        UPDATE common_location
        SET point = ST_SetSRID(
            ST_MakePoint(
                ROUND(ST_X(point::geometry)::numeric, %s),
                ROUND(ST_Y(point::geometry)::numeric, %s)
            ),
            ST_SRID(point::geometry)
        )
        WHERE ROUND(ST_X(point::geometry)::numeric, %s) != ST_X(point::geometry)
           OR ROUND(ST_Y(point::geometry)::numeric, %s) != ST_Y(point::geometry)
        """,
        [GPS_PRECISION, GPS_PRECISION, GPS_PRECISION, GPS_PRECISION],
    )

    # --- 2. Re-point FKs on any models referencing duplicate Locations ------
    # Build the duplicate-detection CTE once; reuse for each FK table.
    fk_tables = []
    for label in ("notes.Note", "hmis.HmisNote"):
        try:
            model = apps.get_model(label)
            fk_tables.append(model._meta.db_table)
        except LookupError:
            pass

    for table in fk_tables:
        execute(
            f"""
            UPDATE {table} SET location_id = keeper.keep_id
            FROM (
                SELECT MIN(id) AS keep_id, address_id, point, point_of_interest
                FROM common_location
                GROUP BY address_id, point, point_of_interest
                HAVING COUNT(*) > 1
            ) keeper
            JOIN common_location dup
              ON dup.address_id IS NOT DISTINCT FROM keeper.address_id
             AND dup.point = keeper.point
             AND dup.point_of_interest IS NOT DISTINCT FROM keeper.point_of_interest
             AND dup.id != keeper.keep_id
            WHERE {table}.location_id = dup.id
            """
        )

    # --- 3. Delete the duplicate Location rows ------------------------------
    execute(
        """
        DELETE FROM common_location
        WHERE id IN (
            SELECT dup.id
            FROM common_location dup
            JOIN (
                SELECT MIN(id) AS keep_id, address_id, point, point_of_interest
                FROM common_location
                GROUP BY address_id, point, point_of_interest
                HAVING COUNT(*) > 1
            ) keeper
              ON dup.address_id IS NOT DISTINCT FROM keeper.address_id
             AND dup.point = keeper.point
             AND dup.point_of_interest IS NOT DISTINCT FROM keeper.point_of_interest
             AND dup.id != keeper.keep_id
        )
        """
    )


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
