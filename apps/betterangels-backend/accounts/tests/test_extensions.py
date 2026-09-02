"""Tests for the HasOrgPerm Strawberry extension."""

from unittest.mock import MagicMock

from accounts.extensions import HasOrgPerm
from accounts.models import Grant, PermissionGroup, Role, User
from django.contrib.auth.models import Permission
from django.test import RequestFactory, TestCase
from model_bakery import baker
from organizations.models import Organization
from shelters.groups import SHELTER_OPERATOR
from shelters.models import Shelter
from strawberry.types import Info
from strawberry_django.permissions import DjangoNoPermission


class HasOrgPermTestCase(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.org: Organization = Organization.objects.create(name="Test Org")
        self.user: User = baker.make(User, email="test@example.com")
        self.org.add_user(self.user)

        # Grant-only authority (ADR 0001 §5.3): the user holds the shelter view
        # permission through a scoped Grant at *org*, not a legacy PermissionGroup.
        role = Role.objects.get(name=SHELTER_OPERATOR.name, is_global=False)
        Grant.objects.get_or_create(principal_user=self.user, role=role, scope_org=self.org)

        # A legacy-only holder — a label-only PermissionGroup carrying the same
        # permission — must fail closed: HasOrgPerm no longer reads legacy groups.
        self.legacy_user: User = baker.make(User, email="legacy@example.com")
        self.org.add_user(self.legacy_user)
        self.perm_group = PermissionGroup.objects.create(
            organization=self.org,
            label="test-perm-group",
        )
        self.group = self.perm_group

        # Grant the shelter view permission through this group.
        app_label, codename = Shelter.perms.VIEW.split(".")
        self.perm: Permission = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        self.group.permissions.add(self.perm)
        self.group.user_set.add(self.legacy_user)

    def _make_extension(self, perm: str = Shelter.perms.VIEW) -> HasOrgPerm:
        return HasOrgPerm(perm, fail_silently=False)

    def _make_info(self, org_id: str | None = None, authenticated: bool = True) -> MagicMock:
        """Build a fake Strawberry Info with a request carrying an org header."""
        request = self.factory.post("/graphql")
        request.organization_id = org_id  # type: ignore[attr-defined]

        if authenticated:
            request.user = self.user

        return MagicMock(spec=Info, context=MagicMock(request=request))

    # ── Happy path ─────────────────────────────────────────────────────

    def test_valid_org_and_permission_passes(self) -> None:
        """Grant-only holder passes when org header is set and the user has the perm."""
        extension = self._make_extension()
        info = self._make_info(org_id=str(self.org.id))

        try:
            extension.resolve_for_user(
                resolver=lambda: None,
                user=self.user,
                info=info,
                source=None,
            )
        except DjangoNoPermission:
            self.fail("HasOrgPerm raised DjangoNoPermission unexpectedly")

    def test_legacy_group_only_holder_is_denied(self) -> None:
        """§5.3 provisioning: a user holding the perm only via a legacy
        PermissionGroup fails closed — the grant is the only authority."""
        request = self.factory.post("/graphql")
        request.organization_id = str(self.org.id)  # type: ignore[attr-defined]
        request.user = self.legacy_user
        info = MagicMock(spec=Info, context=MagicMock(request=request))

        extension = self._make_extension()

        with self.assertRaises(DjangoNoPermission):
            extension.resolve_for_user(
                resolver=lambda: None,
                user=self.legacy_user,
                info=info,
                source=None,
            )

    # ── Missing header ─────────────────────────────────────────────────

    def test_no_org_header_raises(self) -> None:
        """Missing X-Organization-ID header raises DjangoNoPermission."""
        extension = self._make_extension()
        info = self._make_info(org_id=None)

        with self.assertRaises(DjangoNoPermission):
            extension.resolve_for_user(
                resolver=lambda: None,
                user=self.user,
                info=info,
                source=None,
            )

    # ── Wrong org ──────────────────────────────────────────────────────

    def test_user_not_member_of_org_raises(self) -> None:
        """Non-member org raises DjangoNoPermission even if header is present."""
        other_org: Organization = Organization.objects.create(name="Other Org")  # user is NOT a member
        extension = self._make_extension()
        info = self._make_info(org_id=str(other_org.id))

        with self.assertRaises(DjangoNoPermission):
            extension.resolve_for_user(
                resolver=lambda: None,
                user=self.user,
                info=info,
                source=None,
            )

    # ── Missing permission ─────────────────────────────────────────────

    def test_user_member_but_lacks_permission_raises(self) -> None:
        """User is org member but doesn't hold the required permission."""
        # Revoke the user's Grant so they no longer have it.
        Grant.objects.filter(principal_user=self.user, scope_org=self.org).delete()
        extension = self._make_extension()
        info = self._make_info(org_id=str(self.org.id))

        with self.assertRaises(DjangoNoPermission):
            extension.resolve_for_user(
                resolver=lambda: None,
                user=self.user,
                info=info,
                source=None,
            )

    # ── Anonymous ──────────────────────────────────────────────────────

    def test_unauthenticated_raises(self) -> None:
        """Anonymous user raises Authentication failed."""
        extension = self._make_extension()
        info = self._make_info(org_id=str(self.org.id), authenticated=False)

        with self.assertRaises(DjangoNoPermission):
            extension.resolve_for_user(
                resolver=lambda: None,
                user=None,  # type: ignore[arg-type]
                info=info,
                source=None,
            )

    # ── No header always denied ────────────────────────────────────────

    def test_no_header_denied_even_with_fail_silently(self) -> None:
        """Missing X-Organization-ID header is always denied, even with fail_silently=True."""
        extension = HasOrgPerm(Shelter.perms.VIEW, fail_silently=True)
        info = self._make_info(org_id=None)

        with self.assertRaises(DjangoNoPermission):
            extension.resolve_for_user(
                resolver=lambda: None,
                user=self.user,
                info=info,
                source=None,
            )
