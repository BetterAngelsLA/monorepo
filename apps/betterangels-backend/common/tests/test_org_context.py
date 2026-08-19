"""Tests for resolving the active organization from the request."""

from types import SimpleNamespace
from typing import Any, cast

from common.permissions.utils import get_current_organization
from django.core.exceptions import PermissionDenied
from django.test import SimpleTestCase
from strawberry.types import Info


def fake_info(organization_id: Any) -> Info:
    """Minimal stand-in for the bits of ``Info`` this helper reads."""
    request = SimpleNamespace(organization_id=organization_id)
    return cast(Info, SimpleNamespace(context=SimpleNamespace(request=request)))


class GetCurrentOrganizationTestCase(SimpleTestCase):
    def test_returns_the_header_org_id_as_a_string(self) -> None:
        self.assertEqual(get_current_organization(fake_info(7)), "7")

    def test_passes_a_string_org_id_through(self) -> None:
        self.assertEqual(get_current_organization(fake_info("7")), "7")

    def test_raises_when_the_header_is_absent(self) -> None:
        """It used to return the literal string "None".

        That pushed the failure downstream into a queryset filter, where it
        surfaced as ``Field 'id' expected a number but got 'None'`` — an error
        that says nothing about the missing header.
        """
        with self.assertRaises(PermissionDenied) as ctx:
            get_current_organization(fake_info(None))

        self.assertIn("X-Organization-ID", str(ctx.exception))

    def test_does_not_return_the_string_none(self) -> None:
        with self.assertRaises(PermissionDenied):
            result = get_current_organization(fake_info(None))
            self.assertNotEqual(result, "None")  # pragma: no cover - guarded above
