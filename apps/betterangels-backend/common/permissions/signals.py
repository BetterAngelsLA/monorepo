"""Grant-row lifecycle signals (ADR 0001 §2.5, finding F3).

``Grant.scope_object`` is a generic pointer: ``(scope_object_type,
scope_object_id)`` names a row with no database-level foreign key, so Django
cannot cascade when that row is deleted.  Without a receiver the grant survives
its subject, pointing at an id that may later belong to a different row — a
stale authority that reads as live.
"""

from typing import Any


def connect_object_grant_cleanup(sender: Any = None, **kwargs: Any) -> None:
    """Connect :func:`delete_object_grants_for` to every whitelisted model.

    Deferred out of ``AppConfig.ready()`` because ``apps.get_model`` cannot
    resolve a model before the registry is populated.  Idempotent via a per-model
    ``dispatch_uid``, so calling it twice (once opportunistically, once from
    ``post_migrate``) connects each sender exactly once.
    """
    from django.apps import apps
    from django.db.models.signals import post_delete

    from common.permissions.config import OBJECT_GRANT_WHITELIST

    for key in OBJECT_GRANT_WHITELIST:
        app_label, _, model_name = key.partition(".")
        try:
            model = apps.get_model(app_label, model_name)
        except LookupError:  # pragma: no cover — a whitelist typo fails E003 first
            continue
        post_delete.connect(
            delete_object_grants_for,
            sender=model,
            dispatch_uid=f"object-grant-cleanup-{key}",
            weak=False,
        )


def delete_object_grants_for(sender: Any, instance: Any, **kwargs: Any) -> None:
    """Drop every object ``Grant`` naming *instance*.

    Runs inside the deleting transaction, so the cleanup rolls back with the
    delete rather than leaving a grant pointing at a removed row — a stale
    authority that would read as live if the id is reused.
    """
    from django.contrib.contenttypes.models import ContentType

    from accounts.models import Grant

    # ``get_for_model`` follows a proxy to its concrete model, which is where the
    # grant is stored — deleting a ClientDocument clears its Attachment grant.
    content_type = ContentType.objects.get_for_model(sender)
    Grant.objects.filter(scope_object_type=content_type, scope_object_id=instance.pk).delete()
