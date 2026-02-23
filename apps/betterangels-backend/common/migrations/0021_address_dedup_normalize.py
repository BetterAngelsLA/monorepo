"""Data migration: deduplicate Address rows and normalize NULLs to ''.

Must run in a separate migration from schema changes because pgtrigger
deferred triggers prevent ALTER TABLE in the same transaction as data changes.
"""

from django.db import migrations


def deduplicate_and_normalize(apps, schema_editor):
    """Re-merge duplicates & convert NULLs to empty strings."""
    execute = schema_editor.execute

    # 1. Re-point Location FKs from duplicate Addresses to the keeper (MIN id).
    execute(
        """
        UPDATE common_location SET address_id = keeper.keep_id
        FROM (
            SELECT MIN(id) AS keep_id,
                   COALESCE(LOWER(street), '') AS norm_street,
                   COALESCE(LOWER(city), '') AS norm_city,
                   COALESCE(LOWER(state), '') AS norm_state,
                   COALESCE(LOWER(zip_code), '') AS norm_zip
            FROM common_address
            GROUP BY norm_street, norm_city, norm_state, norm_zip
            HAVING COUNT(*) > 1
        ) keeper
        JOIN common_address dup
          ON COALESCE(LOWER(dup.street), '') = keeper.norm_street
         AND COALESCE(LOWER(dup.city), '') = keeper.norm_city
         AND COALESCE(LOWER(dup.state), '') = keeper.norm_state
         AND COALESCE(LOWER(dup.zip_code), '') = keeper.norm_zip
         AND dup.id <> keeper.keep_id
        WHERE common_location.address_id = dup.id
    """
    )

    # 2. Delete orphaned duplicate Addresses.
    execute(
        """
        DELETE FROM common_address
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM common_address
            GROUP BY COALESCE(LOWER(street), ''),
                     COALESCE(LOWER(city), ''),
                     COALESCE(LOWER(state), ''),
                     COALESCE(LOWER(zip_code), '')
        )
    """
    )

    # 3. Normalize NULLs to empty strings.
    execute("UPDATE common_address SET street = '' WHERE street IS NULL")
    execute("UPDATE common_address SET city = '' WHERE city IS NULL")
    execute("UPDATE common_address SET state = '' WHERE state IS NULL")
    execute("UPDATE common_address SET zip_code = '' WHERE zip_code IS NULL")
    execute("UPDATE common_address SET formatted_address = '' WHERE formatted_address IS NULL")


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0020_address_functional_index"),
    ]

    operations = [
        migrations.RunPython(deduplicate_and_normalize, migrations.RunPython.noop),
    ]
