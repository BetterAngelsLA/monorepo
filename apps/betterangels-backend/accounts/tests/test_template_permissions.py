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
from django.contrib.auth.models import Permission
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
    """Phantom rows with a real-model twin are retired; no-twin phantoms are kept.

    Simulates a DB seeded before real-model binding: synthesized phantom
    ContentType + Permission rows for codenames that now have a real twin —
    ``reports.view_reports`` on ``ScheduledReport`` and the member-management
    portal codenames on the org-root ``Organization`` model.  Retiring must drop
    both phantoms (and their ContentTypes), re-point references onto the real
    rows, and keep phantoms that still have no real twin.
    """
    from accounts.seed import retire_superseded_phantom_permissions
    from django.contrib.auth import get_user_model
    from django.contrib.contenttypes.models import ContentType
    from organizations.models import Organization

    # Real twins exist: reports.view_reports on ScheduledReport and the portal
    # codenames on the Organization ContentType (seeded at post_migrate).
    real = Permission.objects.get(codename="view_reports", content_type__app_label="reports")
    assert real.content_type.model_class() is not None
    org_real = Permission.objects.get(
        codename="add_org_member", content_type=ContentType.objects.get_for_model(Organization)
    )
    assert org_real.content_type.model_class() is not None

    # Simulate the old synthesized phantoms.
    reports_ct, _ = ContentType.objects.get_or_create(app_label="reports", model="reports")
    reports_phantom, _ = Permission.objects.get_or_create(
        content_type=reports_ct, codename="view_reports", defaults={"name": "Can view reports"}
    )
    orgs_ct, _ = ContentType.objects.get_or_create(app_label="organizations", model="member")
    orgs_phantom, _ = Permission.objects.get_or_create(
        content_type=orgs_ct, codename="add_org_member", defaults={"name": "Can Add Org Member"}
    )

    # A user granted the reports phantom directly (pre-cutover admin grant) —
    # retiring must RE-POINT this onto the real row, never silently revoke it.
    holder = get_user_model().objects.create(username="reports-holder")
    holder.user_permissions.add(reports_phantom)

    # A phantom with no real twin anywhere stays (nothing supersedes it).
    orphan_ct, _ = ContentType.objects.get_or_create(app_label="organizations", model="unbound")
    orphan_phantom, _ = Permission.objects.get_or_create(
        content_type=orphan_ct, codename="future_portal_action", defaults={"name": "Future Portal Action"}
    )

    retire_superseded_phantom_permissions()

    assert not Permission.objects.filter(pk__in=[reports_phantom.pk, orgs_phantom.pk]).exists()
    assert Permission.objects.filter(pk=real.pk).exists()
    assert Permission.objects.filter(pk=org_real.pk).exists()
    # The user's grant survived, now on the real row.
    assert holder.user_permissions.filter(pk=real.pk).exists()
    # No-twin phantom kept.
    assert Permission.objects.filter(pk=orphan_phantom.pk).exists()
    # Phantom ContentTypes dropped once their rows are gone.
    assert not ContentType.objects.filter(app_label="reports", model="reports").exists()
    assert not ContentType.objects.filter(app_label="organizations", model="member").exists()


@pytest.mark.django_db
def test_retire_superseded_phantom_permissions_holder_with_both_rows() -> None:
    """A holder referencing BOTH the phantom and its real twin is not a crash.

    A DB that lived through the transition can hold both rows on one holder.
    Re-pointing must drop the phantom reference (the real one already wins)
    instead of colliding with the through table's unique constraint, which
    would abort ``post_migrate``.
    """
    from accounts.seed import retire_superseded_phantom_permissions
    from django.contrib.auth import get_user_model
    from django.contrib.contenttypes.models import ContentType

    real = Permission.objects.get(codename="view_reports", content_type__app_label="reports")

    phantom_ct, _ = ContentType.objects.get_or_create(app_label="reports", model="reports")
    phantom, _ = Permission.objects.get_or_create(
        content_type=phantom_ct, codename="view_reports", defaults={"name": "Can view reports"}
    )

    holder = get_user_model().objects.create(username="both-rows-holder")
    holder.user_permissions.add(phantom)
    holder.user_permissions.add(real)
    assert holder.user_permissions.filter(pk=phantom.pk).exists()

    retire_superseded_phantom_permissions()

    assert not Permission.objects.filter(pk=phantom.pk).exists()
    # Exactly one reference survives, on the real row — no duplicate, no revoke.
    assert list(holder.user_permissions.values_list("pk", flat=True)) == [real.pk]
