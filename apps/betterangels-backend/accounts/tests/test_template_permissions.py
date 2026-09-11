"""Tests that validate all registered template permissions resolve to
actual Django ``Permission`` objects.

This is a safety net: if a migration moves a permission to a different
content type but the corresponding ``TemplateConfig`` is not updated,
this test will catch it before it silently strips permissions from groups.
"""

from collections import defaultdict
from functools import reduce

import pytest
from common.org_types import REGISTRY
from django.contrib.auth.models import Group, Permission
from django.db.models import Q


@pytest.mark.django_db
def test_all_template_permissions_resolve() -> None:
    """Every permission string in every registered ``TemplateConfig``
    must map to an existing Django ``Permission``.

    One query fetches all existing permissions; unresolved ones are
    the set difference between config expectations and DB reality."""
    # Map (app_label, codename) → list of template names that expect it.
    expected: dict[tuple[str, str], list[str]] = defaultdict(list)
    for tn in REGISTRY.template_names():
        if cfg := REGISTRY.template(tn):
            for ps in cfg.permissions or []:
                a, c = ps.split(".", 1)
                expected[(a, c)].append(tn)

    if not expected:
        if REGISTRY.template_names():
            pytest.fail(
                f"No permissions defined for any registered template: {', '.join(sorted(REGISTRY.template_names()))}"
            )
        return

    # Single OR-filter to find all expected permissions that exist.
    q = reduce(
        Q.__or__,
        (Q(codename=c, content_type__app_label=a) for a, c in expected),
        Q(),
    )
    existing = set(Permission.objects.filter(q).values_list("content_type__app_label", "codename"))

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


@pytest.mark.django_db
def test_retire_superseded_phantom_permissions() -> None:
    """Phantom rows with a real-model twin are retired; portal phantoms are kept.

    Simulates a DB seeded before real-model binding: a synthesized
    ``(reports, reports)`` phantom ContentType + ``view_reports`` Permission that
    now has a real twin on ``ScheduledReport``.  Retiring must drop the phantom
    (and its ContentType) but keep the real row — and the member-management
    portal phantoms (``organizations.*``), which still have no real twin.
    """
    from accounts.seed import retire_superseded_phantom_permissions
    from django.contrib.auth import get_user_model
    from django.contrib.contenttypes.models import ContentType

    # A real twin exists: reports.view_reports on ScheduledReport (model Meta).
    real = Permission.objects.get(codename="view_reports", content_type__app_label="reports")
    assert real.content_type.model_class() is not None

    # Simulate the old synthesized phantom.
    phantom_ct, _ = ContentType.objects.get_or_create(app_label="reports", model="reports")
    phantom, _ = Permission.objects.get_or_create(
        content_type=phantom_ct, codename="view_reports", defaults={"name": "Can view reports"}
    )

    # A user granted the phantom directly (pre-cutover admin grant) — retiring
    # must RE-POINT this onto the real row, never silently revoke it.
    holder = get_user_model().objects.create(username="reports-holder")
    holder.user_permissions.add(phantom)

    # Holders referencing BOTH rows (a DB that lived through the transition):
    # the re-point must drop the phantom reference first instead of colliding
    # with the through-table unique constraint and aborting post_migrate.
    both_user = get_user_model().objects.create(username="both-rows-holder")
    both_user.user_permissions.add(phantom, real)
    both_group = Group.objects.create(name="both-rows-group")
    both_group.permissions.add(phantom, real)

    # A portal phantom with no real twin (member management is still legacy).
    portal_ct, _ = ContentType.objects.get_or_create(app_label="organizations", model="member")
    portal_phantom, _ = Permission.objects.get_or_create(
        content_type=portal_ct, codename="add_org_member", defaults={"name": "Can Add Org Member"}
    )

    retire_superseded_phantom_permissions()

    assert not Permission.objects.filter(pk=phantom.pk).exists()
    assert Permission.objects.filter(pk=real.pk).exists()
    # The user's grant survived, now on the real row.
    assert holder.user_permissions.filter(pk=real.pk).exists()
    # Both-rows holders kept the real reference and lost the phantom one.
    assert not both_user.user_permissions.filter(pk=phantom.pk).exists()
    assert both_user.user_permissions.filter(pk=real.pk).exists()
    assert not both_group.permissions.filter(pk=phantom.pk).exists()
    assert both_group.permissions.filter(pk=real.pk).exists()
    # Portal phantom has no real twin → kept.
    assert Permission.objects.filter(pk=portal_phantom.pk).exists()
    # Phantom ContentType dropped once its rows are gone.
    assert not ContentType.objects.filter(app_label="reports", model="reports").exists()
