"""Team validators — rules enforced on every writer, not just the services.

Field validators run from ``full_clean()``, so a rule declared here holds for
the Django admin and management commands as well as the GraphQL mutations.

Nothing in this module may import ``teams.models`` at module level: ``Team``
imports *this* module for its field validators, so a top-level model import
would be circular. Import inside the function body instead.
"""

from django.core.exceptions import ValidationError


def validate_has_alphanumeric(value: str) -> None:
    """Raise unless *value* contains at least one alphanumeric character.

    A team called "---" is indistinguishable from a blank one to anyone reading
    a list, and *name* is the only identifier a team has.

    Note that ``full_clean()`` skips validators for an empty value, so a name
    that is blank after stripping is rejected by ``blank=False`` with Django's
    own message rather than by this rule.
    """
    if not any(character.isalnum() for character in value):
        raise ValidationError("Team name must contain at least one alphanumeric character.")
