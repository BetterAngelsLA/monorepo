from dataclasses import FrozenInstanceError

import pytest
from accounts.org_type_registry import (
    OrgTypeNotFoundError,
    OrgTypePreset,
    OrgTypeRegistry,
    RegistryError,
)
from common.permissions.config import TemplateConfig


class TestOrgTypePreset:
    """Confirm that OrgTypePreset construction works without side-effects."""

    def test_minimal_preset(self) -> None:
        preset = OrgTypePreset(
            name="test",
            label="Test",
            permission_templates=(TemplateConfig(name="basic", permissions=["perm.a"]),),
        )
        assert preset.name == "test"
        assert preset.label == "Test"
        assert len(preset.permission_templates) == 1
        assert preset.invite_body_html is None
        assert preset.invite_body_txt is None

    def test_preset_with_invite_templates(self) -> None:
        preset = OrgTypePreset(
            name="full",
            label="Full",
            permission_templates=(TemplateConfig(name="admin", permissions=[]),),
            invite_body_html="app/email/invite.html",
            invite_body_txt="app/messages/invite.txt",
        )
        assert preset.invite_body_html == "app/email/invite.html"
        assert preset.invite_body_txt == "app/messages/invite.txt"

    def test_preset_is_frozen(self) -> None:
        preset = OrgTypePreset(
            name="frozen",
            label="Frozen",
            permission_templates=(TemplateConfig(name="x", permissions=[]),),
        )
        with pytest.raises(FrozenInstanceError):
            preset.name = "other"  # type: ignore[misc]


class TestOrgTypeRegistry:
    """Unit tests for OrgTypeRegistry — no database needed."""

    @pytest.fixture(autouse=True)
    def _reset(self) -> None:
        """Ensure each test starts with a clean registry."""
        OrgTypeRegistry.reset()

    def _make_preset(
        self,
        name: str = "test",
        label: str = "Test",
        permissions: tuple[TemplateConfig, ...] | None = None,
    ) -> OrgTypePreset:
        if permissions is None:
            permissions = (TemplateConfig(name="basic", permissions=["perm.a"]),)
        return OrgTypePreset(name=name, label=label, permission_templates=permissions)

    # ---- singleton lifecycle -----------------------------------------------------------

    def test_get_returns_same_instance(self) -> None:
        r1 = OrgTypeRegistry.get()
        r2 = OrgTypeRegistry.get()
        assert r1 is r2

    def test_reset_creates_new_instance(self) -> None:
        r1 = OrgTypeRegistry.get()
        OrgTypeRegistry.reset()
        r2 = OrgTypeRegistry.get()
        assert r1 is not r2

    # ---- register ---------------------------------------------------------------------

    def test_register_and_retrieve(self) -> None:
        reg = OrgTypeRegistry.get()
        preset = self._make_preset()
        reg.register(preset)

        assert reg.lookup("test") is preset
        assert "test" in reg
        assert len(reg) == 1

    def test_register_multiple_presets(self) -> None:
        reg = OrgTypeRegistry.get()
        a = self._make_preset("a")
        b = self._make_preset("b")
        reg.register(a)
        reg.register(b)

        assert len(reg) == 2
        assert reg.lookup("a") is a
        assert reg.lookup("b") is b

    def test_register_duplicate_raises(self) -> None:
        reg = OrgTypeRegistry.get()
        reg.register(self._make_preset("dup"))

        with pytest.raises(RegistryError, match="already registered"):
            reg.register(self._make_preset("dup"))

    def test_register_empty_name_raises(self) -> None:
        reg = OrgTypeRegistry.get()
        preset = self._make_preset(name="")

        with pytest.raises(RegistryError, match="name cannot be empty"):
            reg.register(preset)

    def test_register_no_permission_templates_raises(self) -> None:
        reg = OrgTypeRegistry.get()
        preset = OrgTypePreset(
            name="empty",
            label="Empty",
            permission_templates=(),
        )

        with pytest.raises(RegistryError, match="must declare at least one"):
            reg.register(preset)

    # ---- queries ----------------------------------------------------------------------

    def test_lookup_missing_raises(self) -> None:
        reg = OrgTypeRegistry.get()

        with pytest.raises(OrgTypeNotFoundError, match="not-found"):
            reg.lookup("not-found")

    def test_all_returns_insertion_order(self) -> None:
        reg = OrgTypeRegistry.get()
        a = self._make_preset("a")
        b = self._make_preset("b")
        c = self._make_preset("c")
        reg.register(a)
        reg.register(b)
        reg.register(c)

        assert reg.all() == [a, b, c]

    def test_names(self) -> None:
        reg = OrgTypeRegistry.get()
        reg.register(self._make_preset("x"))
        reg.register(self._make_preset("y"))

        assert reg.names() == ["x", "y"]

    def test_len(self) -> None:
        reg = OrgTypeRegistry.get()
        assert len(reg) == 0

        reg.register(self._make_preset("a"))
        assert len(reg) == 1

    def test_contains(self) -> None:
        reg = OrgTypeRegistry.get()
        reg.register(self._make_preset("a"))

        assert "a" in reg
        assert "b" not in reg

    # ---- OrgTypeNotFoundError message -------------------------------------------------

    def test_not_found_error_includes_available(self) -> None:
        reg = OrgTypeRegistry.get()
        reg.register(self._make_preset("alpha"))
        reg.register(self._make_preset("beta"))

        with pytest.raises(OrgTypeNotFoundError, match=r"gamma.*\['alpha', 'beta'\]"):
            reg.lookup("gamma")
