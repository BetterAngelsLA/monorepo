"""The admin is a viewer, not a second write path.

Boundaries are produced by ``manage.py import_regions`` and replaced wholesale per dimension,
so the admin exists to inspect the loaded set. These assertions are about the *permissions*
rather than the field list, deliberately: every field being read-only still leaves a valid
form, and a valid form is what lets a POST save.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from model_bakery import baker

from regions.models import Region, RegionKind

from .helpers import BOX_A, box


class RegionAdminTestCase(TestCase):
    def setUp(self) -> None:
        # Plain staff, not a superuser: the point is that a view does not need a `regions.*`
        # codename, and a change is refused even for someone who could otherwise use the admin.
        self.staff = baker.make(get_user_model(), is_staff=True, is_active=True)
        self.client.force_login(self.staff)
        self.region = Region.objects.create(kind=RegionKind.CITY, code="1", name="City 1", geom=box(BOX_A))

    def _change_url(self) -> str:
        return reverse("admin:regions_region_change", args=[self.region.pk])

    def test_the_changelist_reaches_staff_without_a_regions_permission(self) -> None:
        response = self.client.get(reverse("admin:regions_region_changelist"))
        self.assertEqual(response.status_code, 200)

    def test_the_detail_page_renders_without_a_save_button(self) -> None:
        response = self.client.get(self._change_url())
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, 'name="_save"')

    def test_a_post_cannot_write(self) -> None:
        """403, not a silent no-op save.

        With change permission this POST would succeed: every field is read-only, so the form
        has nothing to validate and ``save_model`` runs — bumping ``updated_at`` and logging a
        change that changed nothing.
        """
        before = Region.objects.get(pk=self.region.pk).updated_at
        response = self.client.post(self._change_url(), {"name": "tampered"})
        self.assertEqual(response.status_code, 403)
        region = Region.objects.get(pk=self.region.pk)
        self.assertEqual(region.name, "City 1")
        self.assertEqual(region.updated_at, before)
