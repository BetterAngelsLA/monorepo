"""Organization scoping in ``PermissionedQuerySet``.

These exercise ``_prepare_qs`` directly rather than through GraphQL so the
organization filter can be isolated from the object-permission filter that
runs alongside it.

Each user here is granted the permission **globally** — no guardian object
permissions at all.  That is not a contrivance: it is the shape that makes
the org filter necessary.  ``filter_for_user`` OR's in
``Exists(user.user_permissions ...)``, so a global grant matches every row in
the table regardless of who owns it.  Object permissions alone therefore do
not confine a write to one organization, and whatever narrowing these tests
observe is the organization filter's doing and nothing else.

End-to-end coverage of the same behaviour, including the denial a client
actually sees, lives with the mutations in ``notes`` and ``referrals``.
"""

from types import SimpleNamespace
from typing import Any, Optional

from accounts.models import User
from accounts.tests.baker_recipes import organization_recipe
from common.graphql.extensions import PermissionedQuerySet
from common.permissions.utils import require_organization_id
from django.contrib.auth.models import Permission
from django.test import TestCase
from model_bakery import baker
from notes.models import Note, ServiceRequest
from notes.permissions import NotePermissions, ServiceRequestPermissions
from strawberry_django.permissions import DjangoNoPermission


def _stub_info(user: Optional[User] = None, organization_id: Any = None) -> Any:
    """Minimum shape ``_prepare_qs`` reads: ``info.context.request``."""
    return SimpleNamespace(
        context=SimpleNamespace(
            request=SimpleNamespace(user=user, organization_id=organization_id),
        )
    )


def _user_with_global_perm(perm: str) -> User:
    """A user holding *perm* model-wide, the way the guardian fallback grants it."""
    app_label, codename = perm.split(".", 1)
    user = baker.make(User, is_active=True)
    user.user_permissions.add(
        Permission.objects.get(content_type__app_label=app_label, codename=codename),
    )
    return user


class RequireOrganizationIdTestCase(TestCase):
    def test_returns_a_string_id(self) -> None:
        self.assertEqual(require_organization_id(_stub_info(organization_id="42")), "42")

    def test_coerces_a_non_string_id(self) -> None:
        """The middleware reads a header, but tests and other callers pass ints."""
        self.assertEqual(require_organization_id(_stub_info(organization_id=42)), "42")

    def test_raises_when_the_header_is_absent(self) -> None:
        with self.assertRaises(DjangoNoPermission) as ctx:
            require_organization_id(_stub_info(organization_id=None))

        self.assertIn("X-Organization-ID", str(ctx.exception))

    def test_never_returns_the_string_none(self) -> None:
        """Regression: ``str(None)`` used to reach queryset filters as ``"None"``.

        That is not a valid organization id, so the request failed anyway —
        but as ``ValueError: Field 'id' expected a number but got 'None'``,
        an unhandled 500 rather than a denial.
        """
        with self.assertRaises(DjangoNoPermission):
            require_organization_id(_stub_info(organization_id=None))


class PermissionedQuerySetOrgScopingTestCase(TestCase):
    def setUp(self) -> None:
        self.org_1 = organization_recipe.make(name="pqs_org_1")
        self.org_2 = organization_recipe.make(name="pqs_org_2")

        self.user = _user_with_global_perm(NotePermissions.CHANGE)

        self.note_1 = baker.make(Note, organization=self.org_1)
        self.note_2 = baker.make(Note, organization=self.org_2)

    def _prepare(self, extension: PermissionedQuerySet, organization_id: Any) -> Any:
        return extension._prepare_qs(_stub_info(self.user, organization_id))

    def test_scopes_to_the_active_organization(self) -> None:
        extension = PermissionedQuerySet(
            model=Note, perms=[NotePermissions.CHANGE], organization_field="organization_id"
        )

        qs = self._prepare(extension, self.org_1.pk)

        self.assertEqual(list(qs), [self.note_1])

    def test_opting_out_leaves_every_organization_visible(self) -> None:
        """``organization_field=None`` is the deliberate shared-layer escape hatch."""
        extension = PermissionedQuerySet(model=Note, perms=[NotePermissions.CHANGE], organization_field=None)

        qs = self._prepare(extension, self.org_1.pk)

        self.assertCountEqual(qs, [self.note_1, self.note_2])

    def test_opting_out_does_not_require_the_header(self) -> None:
        extension = PermissionedQuerySet(model=Note, perms=[NotePermissions.CHANGE], organization_field=None)

        qs = self._prepare(extension, None)

        self.assertCountEqual(qs, [self.note_1, self.note_2])

    def test_missing_header_denies_when_scoped(self) -> None:
        extension = PermissionedQuerySet(
            model=Note, perms=[NotePermissions.CHANGE], organization_field="organization_id"
        )

        with self.assertRaises(DjangoNoPermission):
            self._prepare(extension, None)

    def test_rejects_an_empty_field_list(self) -> None:
        """An empty list would silently scope to nothing; ``None`` is the way to opt out."""
        with self.assertRaises(ValueError):
            PermissionedQuerySet(model=Note, perms=[NotePermissions.CHANGE], organization_field=[])


class PermissionedQuerySetMultiPathTestCase(TestCase):
    """ServiceRequest reaches its organization through two reverse m2m paths."""

    ORG_FIELDS = ["provided_notes__organization_id", "requested_notes__organization_id"]

    def setUp(self) -> None:
        self.org_1 = organization_recipe.make(name="pqs_multi_org_1")
        self.org_2 = organization_recipe.make(name="pqs_multi_org_2")
        self.user = _user_with_global_perm(ServiceRequestPermissions.DELETE)

        self.note_1 = baker.make(Note, organization=self.org_1)
        self.note_2 = baker.make(Note, organization=self.org_2)

        self.provided = baker.make(ServiceRequest)
        self.note_1.provided_services.add(self.provided)

        self.requested = baker.make(ServiceRequest)
        self.note_1.requested_services.add(self.requested)

        self.other_org = baker.make(ServiceRequest)
        self.note_2.provided_services.add(self.other_org)

    def _prepare(self, organization_id: Any) -> Any:
        extension = PermissionedQuerySet(
            model=ServiceRequest,
            perms=[ServiceRequestPermissions.DELETE],
            organization_field=self.ORG_FIELDS,
        )
        return extension._prepare_qs(_stub_info(self.user, organization_id))

    def test_matches_on_either_path(self) -> None:
        qs = self._prepare(self.org_1.pk)

        self.assertCountEqual(qs, [self.provided, self.requested])

    def test_excludes_another_organizations_service_request(self) -> None:
        self.assertNotIn(self.other_org, self._prepare(self.org_1.pk))

    def test_a_service_request_on_several_notes_appears_once(self) -> None:
        """The org filter LEFT JOINs both m2m tables, so a service request
        reachable through more than one note comes back once per matching
        join row.  Without ``.distinct()`` a later ``.get()`` raises
        ``MultipleObjectsReturned`` — a 500 on a request that should succeed.

        One note on each *side* is not enough to trigger it (1 x 1 = 1 row);
        it takes two matches on the same side.  ``note_service_request_create``
        makes one service request per note today, so this is not reachable
        through the API yet — but the m2m permits it and
        ``ServiceRequest.get_note_id`` is written in anticipation of it.
        """
        shared = baker.make(ServiceRequest)
        other_note = baker.make(Note, organization=self.org_1)
        self.note_1.provided_services.add(shared)
        other_note.provided_services.add(shared)

        qs = self._prepare(self.org_1.pk)

        self.assertEqual(list(qs).count(shared), 1)
        self.assertEqual(qs.get(pk=shared.pk), shared)
