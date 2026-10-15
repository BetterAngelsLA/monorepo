"""The calendar a report's days are cut on.

Lives here rather than in ``selectors`` because it is not a query — it reads one
attribute and builds a ``ZoneInfo``.  Anything that needs the answer imports from
this module, including ``models``: keeping it in ``selectors`` would mean a model
importing from the read layer, which inverts the dependency for no gain.
"""

import logging
from zoneinfo import ZoneInfo

from django.utils import timezone
from organizations.models import Organization

logger = logging.getLogger(__name__)


def report_calendar_time_zone(org: Organization) -> ZoneInfo:
    """The timezone a report's calendar days are cut on — the org's, never a viewer's.

    A report is an organization record: the same month emailed on a schedule and
    downloaded from the portal has to contain the same rows.  Reading the zone a
    request activated would let a viewer shift which records the range covers, and
    would let the boundary disagree with the scheduled send for the same period.

    The calendar belongs to the organization the days are about, so it is stored
    there and only falls back to the deployment's ``TIME_ZONE`` when the org has not
    named one — which is every org until someone sets it.

    ``getattr`` rather than ``org.profile`` because the reverse one-to-one raises
    ``RelatedObjectDoesNotExist``, and an org without a profile row is a normal
    state here (the admin and its tests both create them).

    A stored name that ``zoneinfo`` cannot resolve falls back to the site zone with a
    warning rather than raising.  ``validate_iana_time_zone`` only runs through
    ``full_clean``, so an ORM write, a data import or raw SQL can store a bad value —
    and raising here would 500 the summary, the export and the scheduled email for
    that org every time, which is a worse failure than reporting on a wrong calendar.
    """
    profile = getattr(org, "profile", None)
    if profile is not None and profile.time_zone:
        try:
            return ZoneInfo(profile.time_zone)
        except ValueError, KeyError:
            logger.warning(
                "Organization %s has an unusable report time zone %r; using %s",
                org.pk,
                profile.time_zone,
                timezone.get_default_timezone(),
            )
    return timezone.get_default_timezone()
