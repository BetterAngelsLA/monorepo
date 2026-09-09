from django.http import QueryDict
from django.test import TestCase
from shelters.admin import GroupedServiceWidget, ShelterForm, ShelterResource
from shelters.models import ContactInfo, Service, ServiceCategory, Shelter


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


class ShelterResourceContactImportTestCase(TestCase):
    """``ShelterResource.after_save_instance`` persists ``additional_contacts`` rows."""

    def test_additional_contacts_are_saved_with_email_and_title(self) -> None:
        shelter = Shelter.objects.create(name="Contact Import Shelter")

        ShelterResource().after_save_instance(
            shelter,
            {"additional_contacts": [("Ada", "2125550100", "ada@example.org", "Director")]},
            dry_run=False,
        )

        contact = ContactInfo.objects.get(shelter=shelter)
        self.assertEqual(contact.contact_name, "Ada")
        self.assertEqual(contact.contact_number, "2125550100")
        self.assertEqual(contact.contact_email, "ada@example.org")
        self.assertEqual(contact.contact_title, "Director")

    def test_blank_email_and_title_are_stored_as_null(self) -> None:
        shelter = Shelter.objects.create(name="Sparse Contact Shelter")

        ShelterResource().after_save_instance(
            shelter,
            {"additional_contacts": [("Grace", "2125550101", "", "")]},
            dry_run=False,
        )

        contact = ContactInfo.objects.get(shelter=shelter)
        self.assertIsNone(contact.contact_email)
        self.assertIsNone(contact.contact_title)

    def test_dry_run_creates_nothing(self) -> None:
        shelter = Shelter.objects.create(name="Dry Run Shelter")

        ShelterResource().after_save_instance(
            shelter,
            {"additional_contacts": [("Ada", "2125550100", "ada@example.org", "Director")]},
            dry_run=True,
        )

        self.assertFalse(ContactInfo.objects.filter(shelter=shelter).exists())
