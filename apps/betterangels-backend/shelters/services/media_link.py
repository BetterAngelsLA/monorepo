"""Media link services — create, update, and delete shelter media links.

Authorization lives here (ADR 0001 §2.6), not in the GraphQL layer.  Writes
are gated on the *parent shelter's* ``change_shelter`` permission, the same
gate the shelter-photo pipeline uses: a scoped Shelter Operator Grant carries
``change_shelter``, while ``shelters.MediaLink`` permissions exist only on the
global role (``shelters/groups.py``).
"""

from typing import TYPE_CHECKING, Any, Dict

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from strawberry import UNSET

from common.utils import get_by_pk_or_not_found
from shelters.models import MediaLink, Shelter
from shelters.selectors import shelter_get, shelter_queryset

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def media_link_create(*, user: "User", data: Dict[str, Any]) -> MediaLink:
    """Create a media link on an existing Shelter.

    Resolves *shelter* via :func:`~shelters.selectors.shelter_get` with
    ``change_shelter`` permission (reach-scoped).

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the shelter is not
        found or the user cannot change it.
        ``django.core.exceptions.ValidationError`` on invalid data — e.g. a URL
        rejected by the media type's validator (``MediaLink.clean``).
    """
    data = dict(data)
    shelter_id = data.pop("shelter_id")

    shelter = shelter_get(
        user=user,
        shelter_id=shelter_id,
        permission=Shelter.perms.CHANGE,
    )

    scalar_data = {k: v for k, v in data.items() if v is not None}

    media_link = MediaLink(shelter=shelter, **scalar_data)
    media_link.full_clean()
    media_link.save()

    return media_link


@transaction.atomic
def media_link_update(*, user: "User", data: Dict[str, Any]) -> MediaLink:
    """Update a media link, applying only the fields present in *data*.

    The row is looked up through the reach-scoped shelter queryset, so a media
    link the user cannot change is indistinguishable from a missing one.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the media link is not
        found or the user cannot change its shelter.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    media_link_id = data.pop("id")

    media_link = get_by_pk_or_not_found(
        MediaLink.objects.filter(shelter__in=shelter_queryset(user=user, permission=Shelter.perms.CHANGE)),
        pk=media_link_id,
    )

    for key, value in data.items():
        if value is not UNSET:
            setattr(media_link, key, value)

    media_link.full_clean()
    media_link.save()

    return media_link


@transaction.atomic
def media_link_delete(*, user: "User", ids: list[int]) -> list[int]:
    """Delete media links and return the deleted IDs.

    The queryset is reach-scoped by the user's grants — only media links of
    shelters the user may change are eligible.

    Deleted IDs are returned in the order they were requested (duplicates
    collapsed) — the response must not depend on the DB's row order.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when any id is missing or
        not accessible.
    """
    media_links = MediaLink.objects.filter(
        shelter__in=shelter_queryset(user=user, permission=Shelter.perms.CHANGE),
        pk__in=ids,
    )
    deletable_ids = set(media_links.values_list("pk", flat=True))

    missing = set(ids) - deletable_ids
    if missing:
        raise ObjectDoesNotExist(f"MediaLink IDs not found or not accessible: {sorted(missing)}")

    media_links.delete()

    return [media_link_id for media_link_id in dict.fromkeys(ids) if media_link_id in deletable_ids]
