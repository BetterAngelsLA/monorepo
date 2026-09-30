"""Tests that seed / clone / import writes carry the expected context label.

These labels let the audit selector distinguish routine non-operator writes (seed
data, excluded from the log) from operator-initiated ones (clone/import, kept and
attributed as "system (<label>)"); see ADR 0004 §7b.
"""

from types import SimpleNamespace

from accounts.models import User
from django.contrib import admin
from django.test import RequestFactory, TestCase
from django.urls import reverse
from import_export import resources
from shelters.admin import ShelterAdmin
from shelters.models import City, Service, ServiceCategory, Shelter, SPA
from shelters.seed import CITY_NAMES, SPA_DATA, seed_shelter_lookups

CityEvent = City.pgh_event_model  # type: ignore[attr-defined]
SPAEvent = SPA.pgh_event_model  # type: ignore[attr-defined]
ShelterEvent = Shelter.pgh_event_model  # type: ignore[attr-defined]


class SeedLookupLabelTestCase(TestCase):
    """``seed_shelter_lookups()`` marks its writes so they can be excluded."""

    def setUp(self) -> None:
        # The reused test DB is already seeded by ``post_migrate``; clear the
        # tables so the helpers actually write and emit fresh events.
        Service.objects.all().delete()
        ServiceCategory.objects.all().delete()
        SPA.objects.all().delete()
        City.objects.all().delete()
        self.city_watermark = CityEvent.objects.order_by("-pgh_id").values_list("pgh_id", flat=True).first() or 0
        self.spa_watermark = SPAEvent.objects.order_by("-pgh_id").values_list("pgh_id", flat=True).first() or 0

    def test_seeded_events_carry_the_seed_label_and_no_actor(self) -> None:
        seed_shelter_lookups()

        created_cities = CityEvent.objects.filter(pgh_id__gt=self.city_watermark, pgh_label="city.add")
        created_spas = SPAEvent.objects.filter(pgh_id__gt=self.spa_watermark, pgh_label="spa.add")

        self.assertEqual(created_cities.count(), len(CITY_NAMES))
        self.assertEqual(created_spas.count(), len(SPA_DATA))
        for event in [*created_cities, *created_spas]:
            self.assertIsNotNone(event.pgh_context)
            assert event.pgh_context is not None
            self.assertEqual(event.pgh_context.metadata["label"], "seed")
            self.assertNotIn("user", event.pgh_context.metadata)


class CloneViewLabelTestCase(TestCase):
    """``clone_view`` is an operator action: events keep the actor and get a label."""

    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="clone_label_admin", email="clone_label_admin@example.com", password="password"
        )
        self.client.force_login(self.superuser)

    def test_cloned_writes_carry_the_clone_label_and_the_actor(self) -> None:
        shelter = Shelter.objects.create(name="Original Shelter")

        response = self.client.get(reverse("admin:shelters_shelter_clone", args=[shelter.pk]))

        self.assertEqual(response.status_code, 302)
        copy = Shelter.objects.get(name="Original Shelter (Copy)")
        event = ShelterEvent.objects.filter(pgh_obj_id=copy.pk, pgh_label="shelter.add").latest("pgh_id")
        self.assertIsNotNone(event.pgh_context)
        assert event.pgh_context is not None
        self.assertEqual(event.pgh_context.metadata["label"], "clone")
        self.assertEqual(event.pgh_context.metadata["user"], self.superuser.pk)


class _ProbeResource(resources.ModelResource):
    """Performs one tracked write in place of a real CSV import."""

    def import_data(self, dataset: object, **kwargs: object) -> resources.Result:
        City.objects.create(name="Imported Probe City")
        return resources.Result()


class ImportLabelTestCase(TestCase):
    """``process_dataset`` tags CSV-import writes with the import label."""

    def test_process_dataset_wraps_writes_in_the_import_label(self) -> None:
        superuser = User.objects.create_superuser(
            username="import_label_admin", email="import_label_admin@example.com", password="password"
        )
        request = RequestFactory().post("/admin/shelters/shelter/process_import/")
        request.user = superuser
        form = SimpleNamespace(cleaned_data={"original_file_name": "shelters.csv"})

        model_admin = ShelterAdmin(Shelter, admin.site)
        model_admin.choose_import_resource_class = lambda form, request: _ProbeResource  # type: ignore[method-assign]

        watermark = CityEvent.objects.order_by("-pgh_id").values_list("pgh_id", flat=True).first() or 0
        model_admin.process_dataset([], form, request)

        event = CityEvent.objects.filter(pgh_id__gt=watermark, pgh_label="city.add").latest("pgh_id")
        self.assertIsNotNone(event.pgh_context)
        assert event.pgh_context is not None
        self.assertEqual(event.pgh_context.metadata["label"], "import")
