"""The analytics views: a read-only SQL surface for external analytics.

No models on purpose. The app owns the ``RunSQL`` migrations that create the ``analytics``
schema and the eight views inside it, so an external consumer (such as PostHog) can query
client activity without being granted access to a PHI table. It also owns
the tests that pin each view's column list and grain.

The design rules live in ``docs/analytics.md``.
Read those before adding or changing a view.

Nothing here is a model, so Django has no admin, no GraphQL surface and no
``makemigrations`` diff to show for it. A view that changes shape surfaces only in the
column-list and grain tests — and only in what they assert: column names and grain, not
column types or row filters.
"""

from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "analytics"
