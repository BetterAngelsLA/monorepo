"""The calendars tests are written against.

A report's boundaries are cut on ``settings.TIME_ZONE``, so a test asserting a
boundary is asserting a property of one specific calendar.  Reading that calendar
from django at import time — ``SITE_TZ = timezone.get_default_timezone()`` — looks
like it follows the environment, but the value is frozen when the module is
collected, before any test fixture can set ``TIME_ZONE``.  The suite then half
follows the environment and half does not, and passes or fails depending on how
the machine running it is configured.

Naming the zone here, and having ``conftest`` pin ``settings.TIME_ZONE`` to the
same value, keeps the two in step under any deployment ``TIME_ZONE`` and makes the
dependency visible in the test that has it.

Long term this constant is not what production should use: the calendar a report
was cut on belongs to the report, not to a deployment setting.  When that lands,
these tests should follow the report.
"""

from zoneinfo import ZoneInfo

SITE_TIME_ZONE = "America/Los_Angeles"
SITE_TZ = ZoneInfo(SITE_TIME_ZONE)
