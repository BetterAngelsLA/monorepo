"""Initial audit app state, including the ``Context.created_at`` index.

``purge_audit_log`` selects contexts by ``created_at < cutoff`` and then
anti-joins every event table. ``pghistory`` ships no index on ``created_at``, so
that candidate scan is a full table scan of every context ever written.

The ``Context`` model is owned by ``pghistory`` (its migrations are not ours),
so this is a raw SQL operation rather than a ``Meta.indexes`` change. The name
matches ``Context``'s own ``pghistory_context_*`` convention to make ownership
obvious in ``\\d pghistory_context``.
"""

import django.db.models.manager
from django.db import migrations

INDEX_NAME = "pghistory_context_created_at_idx"
TABLE = "pghistory_context"


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('pghistory', '0007_auto_20250421_0444'),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditWriteEvent',
            fields=[
            ],
            options={
                'verbose_name_plural': 'audit write events',
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=('pghistory.events',),
            managers=[
                ('no_objects', django.db.models.manager.Manager()),
            ],
        ),
        migrations.RunSQL(
            sql=f'CREATE INDEX IF NOT EXISTS "{INDEX_NAME}" ON "{TABLE}" ("created_at");',
            reverse_sql=f'DROP INDEX IF EXISTS "{INDEX_NAME}";',
        ),
    ]
