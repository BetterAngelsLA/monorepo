"""Tests that validate all registered template permissions resolve to
actual Django ``Permission`` objects.

This is a safety net: if a migration moves a permission to a different
content type but the corresponding ``TemplateConfig`` is not updated,
this test will catch it before it silently strips permissions from groups.
"""

from functools import reduce

import pytest
from common.org_types import REGISTRY
from django.contrib.auth.models import Permission
from django.db.models import Q


@pytest.mark.django_db
def test_all_template_permissions_resolve() -> None:
    """Every permission string in every registered ``TemplateConfig``
    must map to an existing Django ``Permission``.

    One query fetches all existing permissions; unresolved ones are
    the set difference between config expectations and DB reality."""
    # Map (app_label, codename) → list of template names that expect it.
    expected: dict[tuple[str, str], list[str]] = {}
    for tn in REGISTRY.template_names():
        cfg = REGISTRY.template(tn)
        if cfg and cfg.permissions:
            for ps in cfg.permissions:
                a, c = ps.split(".", 1)
                expected.setdefault((a, c), []).append(tn)

    if not expected:
        return

    # Single OR-filter to find all expected permissions that exist.
    q = reduce(
        lambda acc, pair: acc | Q(codename=pair[1], content_type__app_label=pair[0]),
        expected,
        Q(),
    )
    existing = set(
        Permission.objects.filter(q).values_list("content_type__app_label", "codename")
    )

    # Missing = config expects it but DB doesn't have it.
    missing = {pair: templates for pair, templates in expected.items() if pair not in existing}

    if missing:
        lines = ["Template permissions that do not resolve to a Django Permission:"]
        for (app_label, codename), templates in sorted(missing.items()):
            perm_str = f"{app_label}.{codename}"
            lines.append(f"  {perm_str}  (expected by: {', '.join(templates)})")
        lines.append(
            "\nA migration may have moved the permission to a different content "
            "type. Update the TemplateConfig in the corresponding app's groups.py "
            "to use the correct app_label.codename."
        )
        pytest.fail("\n".join(lines))
