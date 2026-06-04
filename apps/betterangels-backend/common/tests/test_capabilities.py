"""Tests for accounts.permissions helper functions."""

import pytest
from accounts.permissions import (
    _annotation_key,
    granted_permissions,
    make_granted_permissions,
    permission_annotations,
)
from django.db import models


class FakeAppPerms(models.TextChoices):
    VIEW = "myapp.view_thing", "Can view thing"
    ADD = "myapp.add_thing", "Can add thing"


class AnotherAppPerms(models.TextChoices):
    VIEW = "otherapp.view_widget", "Can view widget"
    ADD = "otherapp.add_widget", "Can add widget"


class TestAnnotationKey:
    def test_includes_app_label_and_codename(self) -> None:
        key = _annotation_key(FakeAppPerms.VIEW)
        assert key == "_perm_myapp_view_thing"

    def test_different_enums_with_same_name_produce_different_keys(self) -> None:
        """Two enums with the same Python name (e.g. VIEW) must not collide."""
        key_a = _annotation_key(FakeAppPerms.VIEW)
        key_b = _annotation_key(AnotherAppPerms.VIEW)
        assert key_a != key_b
        assert key_a == "_perm_myapp_view_thing"
        assert key_b == "_perm_otherapp_view_widget"

    def test_all_keys_in_enum_are_unique(self) -> None:
        keys = [_annotation_key(p) for p in FakeAppPerms]
        assert len(keys) == len(set(keys))

    def test_keys_across_multiple_enums_are_unique(self) -> None:
        """When merging annotations from multiple domains, no collisions occur."""
        all_keys = [_annotation_key(p) for p in FakeAppPerms] + [_annotation_key(p) for p in AnotherAppPerms]
        assert len(all_keys) == len(set(all_keys))


class TestSplitBehavior:
    """Verify that permission value splitting is defensive against multi-dot values."""

    def test_multi_dot_codename_is_preserved(self) -> None:
        """Only the first dot splits app_label from codename; remaining dots stay."""

        class MultiDotPerms(models.TextChoices):
            DEEP = "myapp.deeply.nested.permission", "Can do deeply nested thing"

        key = _annotation_key(MultiDotPerms.DEEP)
        assert key == "_perm_myapp_deeply.nested.permission"

    def test_single_dot_works_as_before(self) -> None:
        """Single-dot values still split correctly."""

        class SimplePerms(models.TextChoices):
            DO = "app.do_stuff", "Can do stuff"

        key = _annotation_key(SimplePerms.DO)
        assert key == "_perm_app_do_stuff"


class TestGrantedPermissions:
    def test_returns_only_granted_perms(self) -> None:
        """Only permissions whose annotation attribute is True are returned."""

        class FakeInstance:
            _perm_myapp_view_thing = True
            _perm_myapp_add_thing = False

        result = granted_permissions(FakeInstance(), FakeAppPerms)
        assert result == [FakeAppPerms.VIEW]

    def test_returns_empty_when_none_granted(self) -> None:
        class FakeInstance:
            _perm_myapp_view_thing = False
            _perm_myapp_add_thing = False

        result = granted_permissions(FakeInstance(), FakeAppPerms)
        assert result == []

    def test_returns_all_when_all_granted(self) -> None:
        class FakeInstance:
            _perm_myapp_view_thing = True
            _perm_myapp_add_thing = True

        result = granted_permissions(FakeInstance(), FakeAppPerms)
        assert set(result) == set(FakeAppPerms)

    def test_missing_attribute_treated_as_not_granted(self) -> None:
        """If the annotation attribute doesn't exist, treat as False."""

        class FakeInstance:
            pass

        result = granted_permissions(FakeInstance(), FakeAppPerms)
        assert result == []


@pytest.mark.django_db
class TestPermissionAnnotations:
    def test_returns_correct_keys(self) -> None:
        from accounts.models import User

        user = User.objects.create_user(username="testuser", password="pass")
        annotations = permission_annotations(user, FakeAppPerms)
        assert set(annotations.keys()) == {"_perm_myapp_view_thing", "_perm_myapp_add_thing"}

    def test_no_key_collisions_across_enums(self) -> None:
        from accounts.models import User

        user = User.objects.create_user(username="testuser2", password="pass")
        ann_a = permission_annotations(user, FakeAppPerms)
        ann_b = permission_annotations(user, AnotherAppPerms)
        merged_keys = list(ann_a.keys()) + list(ann_b.keys())
        assert len(merged_keys) == len(set(merged_keys))


@pytest.mark.django_db
class TestPermissionAnnotationsWithRealEnums:
    """Verify no collisions with the actual project permission enums."""

    def test_all_real_enum_keys_are_unique(self) -> None:
        from accounts.models import User
        from accounts.permissions import UserOrganizationPermissions
        from reports.permissions import ReportPermissions
        from shelters.permissions import ShelterPermissions

        user = User.objects.create_user(username="realuser", password="pass")
        all_keys: list[str] = []
        for enum in (UserOrganizationPermissions, ReportPermissions, ShelterPermissions):
            all_keys.extend(permission_annotations(user, enum).keys())

        assert len(all_keys) == len(set(all_keys)), f"Key collision detected: {all_keys}"


class TestGrantedPermissionsFactory:
    def test_creates_type_with_derived_name(self) -> None:
        CapType = make_granted_permissions(FakeAppPerms)
        assert CapType.__name__ == "FakeAppPermsGrantedPermissions"

    def test_from_instance_returns_granted(self) -> None:
        CapType = make_granted_permissions(FakeAppPerms)

        class FakeInstance:
            _perm_myapp_view_thing = True
            _perm_myapp_add_thing = False

        caps = CapType.from_instance(FakeInstance())
        assert caps.granted == [FakeAppPerms.VIEW]

    def test_truly_values_are_granted(self) -> None:
        """Truthy values beyond True (e.g. 1, non-empty string) should be granted."""

        class FakeInstance:
            _perm_myapp_view_thing = 1  # type: ignore[var-annotated]
            _perm_myapp_add_thing = "yes"  # type: ignore[var-annotated]

        result = granted_permissions(FakeInstance(), FakeAppPerms)
        assert set(result) == set(FakeAppPerms)

    def test_falsy_values_are_not_granted(self) -> None:
        """Falsy values (0, None, empty string) should not be granted."""

        class FakeInstance:
            _perm_myapp_view_thing = 0  # type: ignore[var-annotated]
            _perm_myapp_add_thing = None  # type: ignore[var-annotated]
            # third hypothetical perm would be empty string
            # but FakeAppPerms only has two; verify both are falsy

        result = granted_permissions(FakeInstance(), FakeAppPerms)
        assert result == []

    def test_empty_enum_returns_empty(self) -> None:
        """An enum with no members should produce an empty granted list."""

        class EmptyPerms(models.TextChoices):
            pass

        result = granted_permissions(object(), EmptyPerms)
        assert result == []

    def test_no_matching_annotations_returns_empty(self) -> None:
        """Instance with annotations but none matching the enum returns empty."""

        class UnrelatedInstance:
            _perm_otherapp_view_widget = True

        result = granted_permissions(UnrelatedInstance(), FakeAppPerms)
        assert result == []

    def test_from_instance_with_no_annotations(self) -> None:
        """Factory type's from_instance returns empty when no annotations match."""

        CapType = make_granted_permissions(FakeAppPerms)

        class BareInstance:
            pass

        caps = CapType.from_instance(BareInstance())
        assert caps.granted == []

    def test_from_instance_with_truthy_string_annotation(self) -> None:
        """Factory resolves granted from truthy non-bool annotation values."""

        CapType = make_granted_permissions(FakeAppPerms)

        class FakeInstance:
            _perm_myapp_view_thing = 1  # type: ignore[var-annotated]
            _perm_myapp_add_thing = "nonempty"  # type: ignore[var-annotated]

        caps = CapType.from_instance(FakeInstance())
        assert set(caps.granted) == set(FakeAppPerms)

    def test_factory_type_has_expected_shape(self) -> None:
        """Generated type has get_annotations and from_instance classmethods."""

        CapType = make_granted_permissions(FakeAppPerms)
        assert hasattr(CapType, "get_annotations")
        assert hasattr(CapType, "from_instance")
        assert callable(CapType.get_annotations)
        assert callable(CapType.from_instance)


@pytest.mark.django_db
class TestAsTextChoices:
    """Tests for PermissionSet.as_text_choices()."""

    def test_returns_text_choices_subclass(self) -> None:
        from django.db.models import TextChoices
        from notes.models import Note

        enum = Note.perms.as_text_choices("NotePermissions")
        assert issubclass(enum, TextChoices)

    def test_includes_crud_permissions(self) -> None:
        from notes.models import Note

        enum = Note.perms.as_text_choices("NotePermissions")
        expected = {
            "ADD": Note.perms.ADD,
            "CHANGE": Note.perms.CHANGE,
            "DELETE": Note.perms.DELETE,
            "VIEW": Note.perms.VIEW,
        }
        for name, value in expected.items():
            member = getattr(enum, name)
            assert member.value == value

    def test_includes_custom_permissions(self) -> None:
        from notes.models import Note

        enum = Note.perms.as_text_choices("NotePermissions")
        assert hasattr(enum, "CHANGE_PRIVATE_DETAILS")
        member = enum.CHANGE_PRIVATE_DETAILS  # type: ignore[attr-defined]
        assert member.value == "notes.change_private_details"

    def test_works_with_granted_permissions(self) -> None:
        from accounts.permissions import make_granted_permissions
        from notes.models import Note

        enum = Note.perms.as_text_choices("NotePermissions")
        CapType = make_granted_permissions(enum)
        assert CapType.__name__ == "NotePermissionsGrantedPermissions"

    def test_custom_name(self) -> None:
        from notes.models import Note

        enum = Note.perms.as_text_choices("CustomName")
        assert enum.__name__ == "CustomName"

    def test_repr_uses_label(self) -> None:
        from notes.models import Note

        enum = Note.perms.as_text_choices("NotePermissions")
        view = enum.VIEW  # type: ignore[attr-defined]
        assert view.label
        assert "Can " in str(view.label)


@pytest.mark.django_db
class TestAsTextChoicesWithGrantedPermissionsIntegration:
    """Integration test: as_text_choices() works end-to-end with make_granted_permissions."""

    def test_resolves_granted_permissions(self) -> None:
        from accounts.models import User
        from accounts.permissions import make_granted_permissions
        from model_bakery import baker
        from notes.models import Note
        from organizations.models import Organization

        enum = Note.perms.as_text_choices("NotePermissions")
        CapType = make_granted_permissions(enum)

        # This is a strawberry type — verify it works with annotations
        assert hasattr(CapType, "get_annotations")
        assert hasattr(CapType, "from_instance")

        org = baker.make(Organization)
        user = baker.make(User)
        org.add_user(user)

        annotations = CapType.get_annotations(user)
        # Should have annotation keys for each CRUD perm + custom perms
        assert len(annotations) > 0
        for key in annotations:
            assert key.startswith("_perm_")
