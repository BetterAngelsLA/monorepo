from typing import Any
from unittest.mock import patch

from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ValidationError
from django.http import QueryDict
from django.test import TestCase
from organizations.models import Organization
from shelters.admin import GroupedServiceWidget, ShelterForm, ShelterResource
from shelters.models import Service, ServiceCategory, Shelter


class GroupedServiceWidgetTestCase(TestCase):
    def test_value_from_datadict_ignores_new_tag_placeholders(self) -> None:
        data = QueryDict("", mutable=True)
        data.setlist("services", ["1", "__new__:7::Custom Service", "2"])

        values = GroupedServiceWidget().value_from_datadict(data, {}, "services")

        self.assertEqual(values, ["1", "2"])


class ShelterFormPendingServicesTestCase(TestCase):
    def setUp(self) -> None:
        self.category = ServiceCategory.objects.create(
            name="general_services",
            display_name="General Services",
            priority=0,
        )
        self.existing_other_service = Service.objects.create(
            category=self.category,
            name="laundry",
            display_name="Laundry",
            is_other=True,
            priority=0,
        )
        self.existing_official_service = Service.objects.create(
            category=self.category,
            name="case_management",
            display_name="Case Management",
            is_other=False,
            priority=1,
        )
        self.shelter = Shelter.objects.create(name="Admin Shelter")

    def test_clean_services_deduplicates_pending_entries_case_insensitively(self) -> None:
        data = QueryDict("", mutable=True)
        data.setlist(
            "services__new",
            [
                f"{self.category.id}::Laundry",
                f"{self.category.id}::  laundry  ",
                f"{self.category.id}::Showers",
            ],
        )
        form = ShelterForm(data=data)
        form.cleaned_data = {"services": Service.objects.none()}

        cleaned_services = form.clean_services()

        self.assertEqual(list(cleaned_services), [])
        self.assertEqual(
            form._pending_service_entries,
            [
                (self.category.id, "Laundry"),
                (self.category.id, "Showers"),
            ],
        )

    def test_save_pending_service_entries_reuses_existing_other_and_creates_new_service(self) -> None:
        form = ShelterForm()
        form.instance = self.shelter
        form._pending_service_entries = [
            (self.category.id, "Laundry"),
            (self.category.id, "Showers"),
            (self.category.id, "showers"),
        ]

        form.save_pending_service_entries()

        self.shelter.refresh_from_db()
        attached_service_ids = set(self.shelter.services.values_list("id", flat=True))
        self.assertIn(self.existing_other_service.id, attached_service_ids)
        self.assertEqual(self.shelter.services.filter(display_name__iexact="Showers").count(), 1)

        created_service = self.shelter.services.get(display_name="Showers")
        self.assertTrue(created_service.is_other)
        self.assertEqual(created_service.category, self.category)
        self.assertEqual(created_service.name, "showers")
        self.assertEqual(created_service.priority, 2)

        self.assertEqual(Service.objects.filter(category=self.category, display_name__iexact="Showers").count(), 1)
        self.assertEqual(Service.objects.filter(category=self.category, name="showers", is_other=True).count(), 1)
        self.assertEqual(self.shelter.services.count(), 2)


class ShelterResourceOrganizationTestCase(TestCase):
    """The Shelter import resolves organizations, it does not create them."""

    CUSTOM_FIELDS = (
        "demographics",
        "special_situation_restrictions",
        "shelter_types",
        "shelter_programs",
        "room_styles",
        "funders",
        "entry_requirements",
        "vaccination_requirement",
        "storage",
        "pets",
        "cities_served",
        "accessibility",
        "parking",
    )

    def _row(self, **overrides: Any) -> dict[str, Any]:
        row: dict[str, Any] = {"organization": "", "status": "", "location": "", "additional_contacts": ""}
        row.update({field: "" for field in self.CUSTOM_FIELDS})
        row.update(overrides)
        return row

    def test_known_organization_is_reused(self) -> None:
        organization_recipe.make(name="Alpha Housing")
        row = self._row(organization="Alpha Housing")

        ShelterResource().before_import_row(row)

        self.assertFalse(row["jumpthis"])
        self.assertEqual(Organization.objects.filter(name="Alpha Housing").count(), 1)

    def test_unknown_organization_skips_the_row(self) -> None:
        resource = ShelterResource()
        resource.skip_row_not_val_error = True
        row = self._row(organization="Nowhere Housing")

        resource.before_import_row(row)

        self.assertTrue(row["jumpthis"])
        self.assertFalse(Organization.objects.filter(name="Nowhere Housing").exists())

    def test_unknown_organization_raises_when_not_skipping(self) -> None:
        resource = ShelterResource()
        resource.skip_row_not_val_error = False

        with self.assertRaises(ValidationError):
            resource.before_import_row(self._row(organization="Nowhere Housing"))

        self.assertFalse(Organization.objects.filter(name="Nowhere Housing").exists())

    def test_unknown_organization_stops_before_geocoding(self) -> None:
        resource = ShelterResource()
        row = self._row(organization="Nowhere Housing", location="123 Main Street")

        with patch.object(ShelterResource, "process_address_import") as process_address:
            resource.before_import_row(row)

        process_address.assert_not_called()
