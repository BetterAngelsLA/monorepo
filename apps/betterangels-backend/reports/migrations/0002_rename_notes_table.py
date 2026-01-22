from django.db import migrations


FORWARD_SQL = r"""
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'notes_scheduledreport'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'reports_scheduledreport'
        ) THEN
            -- Drop empty placeholder created by initial migration so we can rename
            IF NOT EXISTS (SELECT 1 FROM reports_scheduledreport LIMIT 1) THEN
                DROP TABLE reports_scheduledreport;
            ELSE
                RAISE EXCEPTION 'reports_scheduledreport already exists with data; aborting rename';
            END IF;
        END IF;

        ALTER TABLE notes_scheduledreport RENAME TO reports_scheduledreport;
    END IF;
END$$;
"""

REVERSE_SQL = r"""
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = 'reports_scheduledreport'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'notes_scheduledreport'
        ) THEN
            -- Drop empty placeholder before renaming back
            IF NOT EXISTS (SELECT 1 FROM notes_scheduledreport LIMIT 1) THEN
                DROP TABLE notes_scheduledreport;
            ELSE
                RAISE EXCEPTION 'notes_scheduledreport already exists with data; aborting rename';
            END IF;
        END IF;

        ALTER TABLE reports_scheduledreport RENAME TO notes_scheduledreport;
    END IF;
END$$;
"""


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(sql=FORWARD_SQL, reverse_sql=REVERSE_SQL),
    ]
