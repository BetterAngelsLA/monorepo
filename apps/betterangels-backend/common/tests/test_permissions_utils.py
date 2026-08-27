"""Organization context helpers in ``common/permissions/utils.py``."""

from common.permissions.utils import require_organization_id
from common.tests.permission_fixtures import stub_info
from django.test import TestCase
from strawberry_django.permissions import DjangoNoPermission


class RequireOrganizationIdTestCase(TestCase):
    def test_returns_a_string_id(self) -> None:
        self.assertEqual(require_organization_id(stub_info(organization_id="42")), "42")

    def test_coerces_a_non_string_id(self) -> None:
        """The middleware reads a header, but tests and other callers pass ints."""
        self.assertEqual(require_organization_id(stub_info(organization_id=42)), "42")

    def test_raises_when_the_header_is_absent(self) -> None:
        with self.assertRaises(DjangoNoPermission) as ctx:
            require_organization_id(stub_info(organization_id=None))

        self.assertIn("X-Organization-ID", str(ctx.exception))

    def test_never_returns_the_string_none(self) -> None:
        """Regression: ``str(None)`` used to reach queryset filters as ``"None"``.

        That is not a valid organization id, so the request failed anyway —
        but as ``ValueError: Field 'id' expected a number but got 'None'``,
        an unhandled 500 rather than a denial.
        """
        with self.assertRaises(DjangoNoPermission):
            require_organization_id(stub_info(organization_id=None))
