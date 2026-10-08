"""Aggregate event model for the audit log.

``AuditEvent`` is a proxy of pghistory's aggregate ``Events`` model that adds
the context-derived fields the audit selector needs: the acting user (both the
live FK and the frozen name/email snapshots from the ADR 0004 §8 middleware)
and the context ``label`` (§11) used for the seed/import/clone split.

All proxy fields are declared ``null=True`` so Django NULL-guards ``.exclude()``
against context-less events (e.g. ``.exclude(label="seed")`` must not drop rows
written outside any ``pghistory.context()``).
"""

import pghistory
from django.conf import settings
from django.db import models


class AuditEvent(pghistory.models.Events):
    actor = pghistory.ProxyField(
        "pgh_context__user",
        models.ForeignKey(
            settings.AUTH_USER_MODEL,
            on_delete=models.DO_NOTHING,
            null=True,
            help_text="The user associated with the event.",
        ),
    )
    actor_name = pghistory.ProxyField(
        "pgh_context__user_name",
        models.TextField(null=True, help_text="The acting user's name frozen at write time."),
    )
    actor_email = pghistory.ProxyField(
        "pgh_context__user_email",
        models.TextField(null=True, help_text="The acting user's email frozen at write time."),
    )
    label = pghistory.ProxyField(
        "pgh_context__label",
        models.TextField(null=True, help_text="The reason label (seed/import/clone), if any."),
    )

    class Meta:
        proxy = True
        verbose_name_plural = "audit events"
