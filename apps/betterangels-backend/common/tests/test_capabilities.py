"""Tests for accounts.permissions helper functions."""

from accounts.permissions import _annotation_key
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
