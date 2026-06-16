"""Tests for the HasOrgPerm Strawberry extension."""

from accounts.extensions import HasOrgPerm
from accounts.models import PermissionGroup, User
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import PermissionDenied
from django.test import RequestFactory, TestCase
from model_bakery import baker
from organizations.models import Organization
from shelters.models import Shelter
from strawberry.types import Info
from unittest.mock import MagicMock


class HasOrgPermTestCase(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.org: Organization = Organization.objects.create(name="Test Org")
        self.user: User = baker.make(User, email="test@example.com")
        self.org.add_user(self.user)

        # Create a PermissionGroup for the org. The save() method auto-creates
        # a Group (named "{org.name}_{name}") and links it to the PermissionGroup.
        # Passing group= is ignored — save() always creates its own.
        self.perm_group = PermissionGroup.objects.create(
            organization=self.org,
            name="test-perm-group",
        )

        # Use the auto-created group (NOT a pre-created one).
        self.group = self.perm_group.group
        assert self.group is not None, "save() should have auto-created a group"

        # Grant the shelter view permission through this group.
        app_label, codename = Shelter.perms.VIEW.split(".")
        self.perm: Permission = Permission.objects.get(
            codename=codename, content_type__app_label=app_label
        )
        self.group.permissions.add(self.perm)
        self.group.user_set.add(self.user)

    def _make_extension(self, perm: str = Shelter.perms.VIEW) -> HasOrgPerm:
        return HasOrgPerm(perm, fail_silently=False)

    def _make_info(self, org_id: str | None = None, authenticated: bool = True) -> MagicMock:
        """Build a fake Strawberry Info with a request carrying an org header."""
        request = self.factory.post("/graphql")
        request.organization_id = org_id  # middleware simulation

        if authenticated:
            request.user = self.user

        return MagicMock(spec=Info, context=MagicMock(request=request))

    # ── Happy path ─────────────────────────────────────────────────────

    def test_valid_org_and_permission_passes(self) -> None:
        """Extension raises nothing when org header is set and user holds the perm."""
        extension = self._make_extension()
        info = self._make_info(org_id=str(self.org.id))

        try:
            extension.resolve_for_user(self.user, info)
        except PermissionDenied:
            self.fail("HasOrgPerm raised PermissionDenied unexpectedly")

    # ── Missing header ─────────────────────────────────────────────────

    def test_no_org_header_raises(self) -> None:
        """Missing X-Organization-ID header raises PermissionDenied."""
        extension = self._make_extension()
        info = self._make_info(org_id=None)

        with self.assertRaises(PermissionDenied):
            extension.resolve_for_user(self.user, info)

    # ── Wrong org ──────────────────────────────────────────────────────

    def test_user_not_member_of_org_raises(self) -> None:
        """Non-member org raises PermissionDenied even if header is present."""
        other_org: Organization = Organization.objects.create(name="Other Org")  # user is NOT a member
        extension = self._make_extension()
        info = self._make_info(org_id=str(other_org.id))

        with self.assertRaises(PermissionDenied):
            extension.resolve_for_user(self.user, info)

    # ── Missing permission ─────────────────────────────────────────────

    def test_user_member_but_lacks_permission_raises(self) -> None:
        """User is org member but doesn't hold the required Django perm."""
        # Remove the group's permission so user no longer has it
        self.group.permissions.clear()
        extension = self._make_extension()
        info = self._make_info(org_id=str(self.org.id))

        with self.assertRaises(PermissionDenied):
            extension.resolve_for_user(self.user, info)

    # ── Anonymous ──────────────────────────────────────────────────────

    def test_unauthenticated_raises(self) -> None:
        """Anonymous user raises Authentication failed."""
        extension = self._make_extension()
        info = self._make_info(org_id=str(self.org.id), authenticated=False)

        with self.assertRaises(PermissionDenied):
            extension.resolve_for_user(None, info)  # type: ignore[arg-type]

    # ── No header always denied ────────────────────────────────────────

    def test_no_header_denied_even_with_fail_silently(self) -> None:
        """Missing X-Organization-ID header is always denied, even with fail_silently=True."""
        extension = HasOrgPerm(Shelter.perms.VIEW, fail_silently=True)
        info = self._make_info(org_id=None)

        with self.assertRaises(PermissionDenied):
            extension.resolve_for_user(self.user, info)
