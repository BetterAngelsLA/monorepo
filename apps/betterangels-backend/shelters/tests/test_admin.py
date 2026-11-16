from django.contrib import admin
from django.contrib.auth.models import Permission
from django.http import HttpRequest, QueryDict
from django.test import RequestFactory, TestCase
from django.urls import reverse

from accounts.models import User
from shelters.admin import AVAILABILITY_FIELDS, GroupedServiceWidget, ShelterAdmin, ShelterForm, ShelterResource
from shelters.models import ContactInfo, Service, ServiceCategory, Shelter, ShelterAvailability


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


class ShelterFormAvailabilityTestCase(TestCase):
    """The availability columns live on the ``Shelter.availability`` OneToOne."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Availability Shelter")
        self.availability = ShelterAvailability.objects.get(shelter=self.shelter)

    def test_initial_values_come_from_the_availability_row(self) -> None:
        ShelterAvailability.objects.filter(pk=self.availability.pk).update(
            non_restricted_beds=4,
            restricted_beds=2,
            restriction_notes="Women only",
        )

        form = ShelterForm(instance=Shelter.objects.get(pk=self.shelter.pk))

        self.assertEqual(form["non_restricted_beds"].value(), 4)
        self.assertEqual(form["restricted_beds"].value(), 2)
        self.assertEqual(form["restriction_notes"].value(), "Women only")

    def test_initial_values_fall_back_to_defaults_without_an_availability_row(self) -> None:
        self.availability.delete()

        form = ShelterForm(instance=Shelter.objects.get(pk=self.shelter.pk))

        self.assertEqual(form["non_restricted_beds"].value(), 0)
        self.assertEqual(form["restricted_beds"].value(), 0)
        self.assertFalse(form["restriction_notes"].value())

    def test_save_availability_persists_the_fields(self) -> None:
        form = ShelterForm(instance=self.shelter)
        form.cleaned_data = {
            "non_restricted_beds": 5,
            "restricted_beds": 1,
            "restriction_notes": "Adults only",
        }

        form.save_availability()

        self.availability.refresh_from_db()
        self.assertEqual(self.availability.non_restricted_beds, 5)
        self.assertEqual(self.availability.restricted_beds, 1)
        self.assertEqual(self.availability.restriction_notes, "Adults only")

    def test_save_availability_recreates_a_missing_row(self) -> None:
        self.availability.delete()
        form = ShelterForm(instance=self.shelter)
        form.cleaned_data = {"non_restricted_beds": 3, "restricted_beds": 0, "restriction_notes": ""}

        form.save_availability()

        created = ShelterAvailability.objects.get(shelter=self.shelter)
        self.assertEqual(created.non_restricted_beds, 3)

    def test_save_availability_skips_unchanged_values(self) -> None:
        form = ShelterForm(instance=self.shelter)
        form.cleaned_data = {
            "non_restricted_beds": self.availability.non_restricted_beds,
            "restricted_beds": self.availability.restricted_beds,
            "restriction_notes": self.availability.restriction_notes,
        }
        updated_at = self.availability.updated_at

        form.save_availability()

        self.availability.refresh_from_db()
        self.assertEqual(self.availability.updated_at, updated_at)


class ShelterAdminAvailabilityTestCase(TestCase):
    """Availability is a global-tier gate (ADR 0001 §2.4)."""

    NEW_VALUES = {"non_restricted_beds": 7, "restricted_beds": 2, "restriction_notes": "Men only"}

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Gated Availability Shelter")
        self.availability = ShelterAvailability.objects.get(shelter=self.shelter)
        self.model_admin = ShelterAdmin(Shelter, admin.site)

    def _request_for(self, user: User) -> HttpRequest:
        request = RequestFactory().post(f"/admin/shelters/shelter/{self.shelter.pk}/change/")
        request.user = user
        return request

    def _form_with_new_values(self) -> ShelterForm:
        # An unbound form never gets ``save_m2m`` from form validation; the admin
        # calls it before the availability hook, so stub it out for the unit test.
        form = ShelterForm(instance=self.shelter)
        form.cleaned_data = dict(self.NEW_VALUES)
        form.save_m2m = lambda: None  # type: ignore[method-assign]
        return form

    def test_fields_are_readonly_without_the_global_grant(self) -> None:
        user = User.objects.create_user(username="scoped_operator", email="scoped@example.com", password="password")

        readonly = self.model_admin.get_readonly_fields(self._request_for(user), self.shelter)

        self.assertTrue(set(AVAILABILITY_FIELDS).issubset(readonly))

    def test_fields_are_editable_with_the_global_grant(self) -> None:
        superuser = User.objects.create_superuser(
            username="availability_admin", email="availability_admin@example.com", password="password"
        )

        readonly = self.model_admin.get_readonly_fields(self._request_for(superuser), self.shelter)

        self.assertFalse(set(AVAILABILITY_FIELDS) & set(readonly))

    def test_save_related_skips_the_write_without_the_global_grant(self) -> None:
        user = User.objects.create_user(
            username="scoped_writer", email="scoped_writer@example.com", password="password"
        )

        self.model_admin.save_related(self._request_for(user), self._form_with_new_values(), [], change=True)

        self.availability.refresh_from_db()
        self.assertEqual(self.availability.non_restricted_beds, 0)
        self.assertEqual(self.availability.restriction_notes, "")

    def test_change_page_renders_the_availability_fields(self) -> None:
        superuser = User.objects.create_superuser(
            username="availability_render_admin", email="availability_render@example.com", password="password"
        )
        self.client.force_login(superuser)

        response = self.client.get(reverse("admin:shelters_shelter_change", args=[self.shelter.pk]))

        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        for name in AVAILABILITY_FIELDS:
            self.assertIn(f'name="{name}"', content)

    def test_change_page_renders_availability_readonly_without_the_global_grant(self) -> None:
        staff = User.objects.create_user(
            username="scoped_render", email="scoped_render@example.com", password="password", is_staff=True
        )
        staff.user_permissions.add(
            Permission.objects.get(content_type__app_label="shelters", codename="change_shelter"),
            Permission.objects.get(content_type__app_label="shelters", codename="view_shelter"),
        )
        self.client.force_login(staff)

        response = self.client.get(reverse("admin:shelters_shelter_change", args=[self.shelter.pk]))

        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        for name in AVAILABILITY_FIELDS:
            self.assertNotIn(f'name="{name}"', content)
        self.assertIn("Available unrestricted beds", content)
        self.assertIn("Available restricted beds", content)
        self.assertIn("Restriction notes", content)

    def test_add_page_renders_the_availability_fields(self) -> None:
        superuser = User.objects.create_superuser(
            username="availability_add_admin", email="availability_add@example.com", password="password"
        )
        self.client.force_login(superuser)

        response = self.client.get(reverse("admin:shelters_shelter_add"))

        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        for name in AVAILABILITY_FIELDS:
            self.assertIn(f'name="{name}"', content)

    def test_save_related_writes_availability_with_the_global_grant(self) -> None:
        superuser = User.objects.create_superuser(
            username="availability_writer", email="availability_writer@example.com", password="password"
        )

        self.model_admin.save_related(self._request_for(superuser), self._form_with_new_values(), [], change=True)

        self.availability.refresh_from_db()
        self.assertEqual(self.availability.non_restricted_beds, 7)
        self.assertEqual(self.availability.restricted_beds, 2)
        self.assertEqual(self.availability.restriction_notes, "Men only")


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
