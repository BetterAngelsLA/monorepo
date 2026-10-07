"""The calendar a report's days are cut on.

Lives here rather than in ``selectors`` because it is not a query — it reads one
attribute and builds a ``ZoneInfo``.  Anything that needs the answer imports from
this module, including ``models``: keeping it in ``selectors`` would mean a model
importing from the read layer, which inverts the dependency for no gain.
"""

from zoneinfo import ZoneInfo

from django.utils import timezone
from organizations.models import Organization


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
    """
    profile = getattr(org, "profile", None)
    if profile is not None and profile.time_zone:
        return ZoneInfo(profile.time_zone)
    return timezone.get_default_timezone()
