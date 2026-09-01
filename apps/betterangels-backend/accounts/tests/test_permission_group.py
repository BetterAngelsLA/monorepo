from common.permissions.utils import assign_object_permissions
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from notes.groups import CASEWORKER
from organizations.models import Organization
from shelters.groups import GLOBAL_SHELTER_OPERATOR

from accounts.models import BigGroupObjectPermission, PermissionGroup, PermissionGroupTemplate
from accounts.seed import sync_group_permissions
from accounts.services import reconcile_org_groups

from .baker_recipes import organization_recipe, permission_group_recipe


class PermissionGroupTestCase(TestCase):
    def test_group_name_reads_as_organization_pk_and_role(self) -> None:
        """Readable label, made unique by the pk.

        ``auth.Group.name`` is unique and capped at 150 characters while
        ``Organization.name`` is neither, so the pk is what prevents a collision —
        but the name is what makes the group picker legible, so it carries both.
        """
        permission_group = permission_group_recipe.make(template=None)

        self.assertEqual(
            permission_group.name,
            f"{permission_group.organization.name} [{permission_group.organization_id}] · {permission_group.label}",
        )

    def test_a_long_organization_name_is_truncated_to_fit(self) -> None:
        """``Organization.name`` allows 200 characters, ``auth.Group.name`` 150."""
        organization = Organization.objects.create(name="L" * 200)
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=CASEWORKER.name)

        permission_group = PermissionGroup.objects.create(organization=organization, template=template)

        self.assertLessEqual(len(permission_group.name), 150)
        self.assertTrue(permission_group.name.endswith(f"[{organization.pk}] · {CASEWORKER.name}"))

    def test_two_organizations_may_share_a_name(self) -> None:
        first = Organization.objects.create(name="Acme")
        second = Organization.objects.create(name="Acme")
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=CASEWORKER.name)

        first_group = PermissionGroup.objects.create(organization=first, template=template)
        second_group = PermissionGroup.objects.create(organization=second, template=template)

        self.assertNotEqual(first_group.name, second_group.name)

    def test_renaming_an_organization_refreshes_its_group_names_on_reconcile(self) -> None:
        """The label carries a copy of the name, so reconcile has to re-apply it.

        A rename outside a reconcile leaves it stale, which is tolerable only
        because nothing reads the group name as data.
        """
        permission_group = permission_group_recipe.make(template=None)
        organization = permission_group.organization

        organization.name = "Renamed Organization"
        organization.save()
        reconcile_org_groups(organization)

        permission_group.refresh_from_db()
        self.assertEqual(
            permission_group.name,
            f"Renamed Organization [{organization.pk}] · {permission_group.label}",
        )

    def test_group_receives_the_permissions_configured_for_its_template(self) -> None:
        organization = organization_recipe.make(owner_roles=())
        permission_group = PermissionGroup.objects.get(organization=organization, template__name=CASEWORKER.name)

        sync_group_permissions()

        granted = set(permission_group.permissions.values_list("content_type__app_label", "codename"))
        expected = {tuple(entry.split(".", 1)) for entry in CASEWORKER.permissions}
        self.assertSetEqual(granted, expected)

    def test_group_without_a_template_has_no_permissions(self) -> None:
        permission_group = permission_group_recipe.make(template=None)

        sync_group_permissions()

        self.assertEqual(permission_group.permissions.count(), 0)

    def test_deleting_permission_group_also_deletes_associated_group(self) -> None:
        permission_group = permission_group_recipe.make()
        group_id = permission_group.pk

        permission_group.delete()

        self.assertFalse(Group.objects.filter(id=group_id).exists())

    def test_deleting_a_permission_group_also_deletes_its_object_permissions(self) -> None:
        """Why the teardown matters at all.

        Object-level grants are assigned to the group and cascade from it.  A group
        that outlived its row would keep granting them, with nothing left to revoke
        through — this is the property inheritance is here to guarantee.
        """
        permission_group = permission_group_recipe.make()
        subject = PermissionGroupTemplate.objects.create(name="Object Of A Grant")
        assign_object_permissions(permission_group, subject, ["accounts.view_permissiongrouptemplate"])
        self.assertTrue(BigGroupObjectPermission.objects.filter(group=permission_group).exists())
        group_id = permission_group.pk

        permission_group.delete()

        self.assertFalse(BigGroupObjectPermission.objects.filter(group_id=group_id).exists())

    def test_deleting_organization_deletes_permission_groups_and_associated_groups(
        self,
    ) -> None:
        organization = organization_recipe.make(owner_roles=())
        permission_group_ids = list(
            PermissionGroup.objects.filter(organization=organization).values_list("pk", flat=True)
        )
        # Captured up front: once the rows are gone, a join through them matches
        # nothing whether or not the groups were actually deleted.
        group_ids = list(PermissionGroup.objects.filter(organization=organization).values_list("pk", flat=True))
        self.assertEqual(len(group_ids), 3)

        organization.delete()

        self.assertFalse(PermissionGroup.objects.filter(pk__in=permission_group_ids).exists())
        self.assertFalse(Group.objects.filter(pk__in=group_ids).exists())

    def test_a_group_with_neither_template_nor_name_is_rejected(self) -> None:
        """The admin inline leaves both optional, but one is needed to name the group.

        Without this the group is named ``org:<pk>:`` and the next such row
        collides on the unique ``auth.Group.name``.
        """
        organization = organization_recipe.make(owner_roles=())

        with self.assertRaises(ValidationError):
            PermissionGroup(organization=organization).full_clean()

    def test_a_writer_that_skips_validation_is_rejected_by_the_database(self) -> None:
        """``objects.create`` never reaches ``clean()``, so the rule lives in a constraint."""
        organization = organization_recipe.make(owner_roles=())

        with self.assertRaises(IntegrityError), transaction.atomic():
            PermissionGroup.objects.create(organization=organization)

    def test_deleting_through_a_queryset_still_deletes_the_group(self) -> None:
        """The production bug was a queryset delete, which skips ``Model.delete()``.

        Group teardown hangs off ``post_delete`` for exactly this reason — it is
        the only mechanism a queryset delete and a cascade both reach.
        """
        permission_group = permission_group_recipe.make()
        group_id = permission_group.pk

        PermissionGroup.objects.filter(pk=permission_group.pk).delete()

        self.assertFalse(Group.objects.filter(id=group_id).exists())


class TemplatePermissionSourceTestCase(TestCase):
    """Where a role's permissions come from depends on whether the code defines it."""

    def test_a_hand_defined_template_propagates_its_own_permissions(self) -> None:
        """The point of a template: define a role once, apply it across organizations.

        The code knows nothing about this role, so the template row is the
        definition and ``sync_group_permissions`` reads it rather than writing it.
        """
        template = PermissionGroupTemplate.objects.create(name="Report Viewer")
        permission = Permission.objects.first()
        assert permission is not None
        template.permissions.add(permission)

        first = organization_recipe.make(owner_roles=())
        second = organization_recipe.make(owner_roles=())
        groups = [
            PermissionGroup.objects.create(organization=organization, template=template)
            for organization in (first, second)
        ]

        sync_group_permissions()

        for permission_group in groups:
            permission_group.refresh_from_db()
            self.assertEqual(list(permission_group.permissions.all()), [permission])

    def test_a_managed_templates_permissions_are_overwritten_from_config(self) -> None:
        """For a role the code defines, ``TemplateConfig`` wins over the stored copy."""
        template = PermissionGroupTemplate.objects.get(name=CASEWORKER.name)
        stray = Permission.objects.exclude(
            codename__in=[entry.split(".", 1)[1] for entry in CASEWORKER.permissions]
        ).first()
        assert stray is not None
        template.permissions.add(stray)

        sync_group_permissions()

        expected = {tuple(entry.split(".", 1)) for entry in CASEWORKER.permissions}
        self.assertSetEqual(set(template.permissions.values_list("content_type__app_label", "codename")), expected)
        self.assertNotIn(stray, template.permissions.all())

    def test_bypasses_org_scoping_is_synced_from_config(self) -> None:
        """Global Shelter Operator opts in; an ordinary managed template does not."""
        global_template = PermissionGroupTemplate.objects.get(name=GLOBAL_SHELTER_OPERATOR.name)
        caseworker_template = PermissionGroupTemplate.objects.get(name=CASEWORKER.name)
        # Simulate drift, e.g. from a stale row predating this field.
        PermissionGroupTemplate.objects.filter(pk=global_template.pk).update(bypasses_org_scoping=False)

        sync_group_permissions()

        global_template.refresh_from_db()
        caseworker_template.refresh_from_db()
        self.assertTrue(global_template.bypasses_org_scoping)
        self.assertFalse(caseworker_template.bypasses_org_scoping)

    def test_bypasses_org_scoping_sync_is_idempotent(self) -> None:
        sync_group_permissions()
        sync_group_permissions()

        template = PermissionGroupTemplate.objects.get(name=GLOBAL_SHELTER_OPERATOR.name)
        self.assertTrue(template.bypasses_org_scoping)

    def test_a_hand_defined_templates_bypasses_org_scoping_is_left_alone(self) -> None:
        """The code knows nothing about a hand-defined role, so this flag is too."""
        template = PermissionGroupTemplate.objects.create(name="Report Viewer", bypasses_org_scoping=True)

        sync_group_permissions()

        template.refresh_from_db()
        self.assertTrue(template.bypasses_org_scoping)
