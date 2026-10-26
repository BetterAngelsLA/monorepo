"""Aggregate event model for the audit log.

``AuditWriteEvent`` is a proxy of pghistory's aggregate ``Events`` model that adds
the context-derived fields the audit selector needs: the acting user's id, name
and email as frozen into the context metadata by the ADR 0004 §8 middleware, and
the context ``label`` (§11) used for the seed/import/clone split. It is the
*write* half of the audit stream; the read half is ``AuditReadEvent`` (Phase 4).

All proxy fields are declared ``null=True`` so Django NULL-guards ``.exclude()``
against context-less events (e.g. ``.exclude(label="seed")`` must not drop rows
written outside any ``pghistory.context()``).
"""

import pghistory
from django.conf import settings
from django.db import models


class AuditWriteEvent(pghistory.models.Events):
    # The actor id as the §8 middleware froze it: the same context-metadata
    # accessor ``MiddlewareEvents.user`` exposes, under the audit vocabulary. It
    # is declared here rather than inherited so the log does not also project
    # ``MiddlewareEvents.url`` in every UNION branch (nothing reads it).
    #
    # Not a relation: pghistory compiles this to
    # ``(_pgh_context.metadata->>'user')::bigint``, so there is no ``User`` join
    # to traverse (``select_related("actor")`` does nothing) and a rename or
    # delete cannot rewrite it. Display comes from ``actor_name``/``actor_email``
    # (§8); this field is the id side, used for ``actorId`` filtering (§21).
    actor = pghistory.ProxyField(
        "pgh_context__user",
        models.ForeignKey(
            settings.AUTH_USER_MODEL,
            on_delete=models.DO_NOTHING,
            null=True,
            help_text="The acting user's id, frozen at write time.",
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
        verbose_name_plural = "audit write events"
