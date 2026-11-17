from django.contrib import admin
from django.contrib.auth.models import Permission
from django.http import HttpRequest, QueryDict
from django.test import RequestFactory, TestCase
from django.urls import reverse

from accounts.models import User
from shelters.admin import (
    GroupedServiceWidget,
    ShelterAdmin,
    ShelterAvailabilityAdmin,
    ShelterForm,
    ShelterResource,
)
from shelters.models import AVAILABILITY_FIELDS, ContactInfo, Service, ServiceCategory, Shelter, ShelterAvailability


def make_staff(username: str, *codenames: str) -> User:
    """A staff user holding *codenames* on ``shelters`` (and nothing else)."""
    staff = User.objects.create_user(
        username=username, email=f"{username}@example.com", password="password", is_staff=True
    )
    staff.user_permissions.add(
        *(Permission.objects.get(content_type__app_label="shelters", codename=code) for code in codenames)
    )
    return staff


def make_admin(username: str) -> User:
    """A superuser for admin-page requests (one per test to keep them independent)."""
    return User.objects.create_superuser(username=username, email=f"{username}@example.com", password="password")


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

    def test_form_rejects_counts_above_total_beds_on_both_counters(self) -> None:
        form = ShelterForm(instance=Shelter.objects.get(pk=self.shelter.pk))
        form.cleaned_data = {
            "non_restricted_beds": 3,
            "restricted_beds": 2,
            "restriction_notes": "",
            "total_beds": 4,
        }

        form._validate_availability_counts(form.cleaned_data)

        message = "Unrestricted + restricted beds (5) cannot exceed the shelter's total beds (4)."
        self.assertEqual(form.errors["non_restricted_beds"], [message])
        self.assertEqual(form.errors["restricted_beds"], [message])

    def test_form_allows_counts_at_the_total_and_an_unknown_total(self) -> None:
        for total_beds in (5, None):
            form = ShelterForm(instance=Shelter.objects.get(pk=self.shelter.pk))
            form.cleaned_data = {
                "non_restricted_beds": 3,
                "restricted_beds": 2,
                "restriction_notes": "",
                "total_beds": total_beds,
            }

            form._validate_availability_counts(form.cleaned_data)

            self.assertEqual(list(form.errors), [])

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

    def _scoped_change_user(self) -> User:
        """A staff user who may change the shelter but holds no availability perm."""
        return make_staff("scoped_render", "change_shelter", "view_shelter")

    def _change_page(self, user: User) -> str:
        """Render the shelter change page as *user* and return its HTML."""
        self.client.force_login(user)
        response = self.client.get(reverse("admin:shelters_shelter_change", args=[self.shelter.pk]))
        self.assertEqual(response.status_code, 200)
        return response.content.decode()

    def test_change_page_renders_the_availability_fields(self) -> None:
        content = self._change_page(make_admin("availability_render_admin"))

        for name in AVAILABILITY_FIELDS:
            self.assertIn(f'name="{name}"', content)

    def test_change_page_renders_the_availability_fields_for_a_scoped_operator(self) -> None:
        """Changing the shelter is enough authority to change its availability."""
        content = self._change_page(self._scoped_change_user())

        for name in AVAILABILITY_FIELDS:
            self.assertIn(f'name="{name}"', content)

    def test_change_page_renders_availability_readonly_for_a_view_only_user(self) -> None:
        """Without change permission the declared fields must still render read-only."""
        content = self._change_page(make_staff("view_only_render", "view_shelter"))

        for name in AVAILABILITY_FIELDS:
            self.assertNotIn(f'name="{name}"', content)
        self.assertIn("Available unrestricted beds", content)
        self.assertIn("Available restricted beds", content)
        self.assertIn("Restriction notes", content)

    def test_add_page_renders_the_availability_fields(self) -> None:
        self.client.force_login(make_admin("availability_add_admin"))

        response = self.client.get(reverse("admin:shelters_shelter_add"))

        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        for name in AVAILABILITY_FIELDS:
            self.assertIn(f'name="{name}"', content)

    def test_save_related_writes_availability(self) -> None:
        self.model_admin.save_related(
            self._request_for(self._scoped_change_user()), self._form_with_new_values(), [], change=True
        )

        self.availability.refresh_from_db()
        self.assertEqual(self.availability.non_restricted_beds, 7)
        self.assertEqual(self.availability.restricted_beds, 2)
        self.assertEqual(self.availability.restriction_notes, "Men only")

    def test_save_does_not_revert_availability_changed_elsewhere(self) -> None:
        """A page left open must not write its stale counters back.

        The form's ``initial`` is the row at render time; a save that leaves the
        availability inputs alone should send nothing, so an edit made in the
        meantime (another operator, or the API) survives.
        """
        form = ShelterForm(instance=self.shelter)
        form.cleaned_data = {name: form.initial[name] for name in AVAILABILITY_FIELDS}
        form.save_m2m = lambda: None  # type: ignore[method-assign]

        # Someone else changes availability after the page was rendered.
        ShelterAvailability.objects.filter(pk=self.availability.pk).update(non_restricted_beds=3)

        self.model_admin.save_related(self._request_for(self._scoped_change_user()), form, [], change=True)

        self.availability.refresh_from_db()
        self.assertEqual(self.availability.non_restricted_beds, 3)

    def test_add_flow_updates_the_signal_created_row(self) -> None:
        """On the add page the signal creates the row during ``form.save()``.

        ``save_related`` then has to update that row rather than insert a second
        one for the same shelter.
        """
        added = Shelter.objects.create(name="Added By Admin")
        form = ShelterForm(instance=added)
        form.cleaned_data = dict(self.NEW_VALUES)
        form.save_m2m = lambda: None  # type: ignore[method-assign]

        self.model_admin.save_related(self._request_for(self._scoped_change_user()), form, [], change=False)

        self.assertEqual(ShelterAvailability.objects.filter(shelter=added).count(), 1)
        created = ShelterAvailability.objects.get(shelter=added)
        self.assertEqual(created.non_restricted_beds, 7)
        self.assertEqual(created.restricted_beds, 2)
        self.assertEqual(created.restriction_notes, "Men only")


class ShelterAvailabilityAdminTestCase(TestCase):
    """The availability admin shows the capacity its counts are validated against."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Availability Admin Shelter", total_beds=12)
        self.availability = ShelterAvailability.objects.get(shelter=self.shelter)
        self.model_admin = ShelterAvailabilityAdmin(ShelterAvailability, admin.site)

    def test_total_beds_reads_through_to_the_shelter(self) -> None:
        self.assertEqual(self.model_admin.total_beds(self.availability), 12)

    def test_total_beds_is_blank_for_an_unsaved_row(self) -> None:
        self.assertIsNone(self.model_admin.total_beds(ShelterAvailability()))

    def test_change_form_lists_the_shelter_and_total_beds(self) -> None:
        self.client.force_login(make_admin("availability_admin_form"))

        response = self.client.get(reverse("admin:shelters_shelteravailability_change", args=[self.availability.pk]))

        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertIn('class="form-row field-shelter"', content)
        self.assertIn(">Availability Admin Shelter</a>", content)
        self.assertIn('<div class="readonly">12</div>', content)

    def _shelter_without_availability(self) -> Shelter:
        shelter = Shelter.objects.create(name="Add Page Shelter", total_beds=6)
        ShelterAvailability.objects.filter(shelter=shelter).delete()
        return shelter

    def test_add_page_offers_the_shelter_field(self) -> None:
        """The FK is what the counts are validated against; it must be settable once."""
        self._shelter_without_availability()
        self.client.force_login(make_admin("availability_add_page"))

        response = self.client.get(reverse("admin:shelters_shelteravailability_add"))

        self.assertEqual(response.status_code, 200)
        content = response.content.decode()
        self.assertIn('name="shelter"', content)

    def test_add_page_creates_a_row_for_the_chosen_shelter(self) -> None:
        shelter = self._shelter_without_availability()
        self.client.force_login(make_admin("availability_add_save"))

        response = self.client.post(
            reverse("admin:shelters_shelteravailability_add"),
            {
                "shelter": str(shelter.pk),
                "non_restricted_beds": 2,
                "restricted_beds": 1,
                "restriction_notes": "Evening intake",
            },
        )

        self.assertEqual(response.status_code, 302)
        created = ShelterAvailability.objects.get(shelter=shelter)
        self.assertEqual(created.non_restricted_beds, 2)
        self.assertEqual(created.restricted_beds, 1)
        self.assertEqual(created.restriction_notes, "Evening intake")

    def test_add_page_rejects_counts_above_the_chosen_shelters_capacity(self) -> None:
        shelter = self._shelter_without_availability()
        self.client.force_login(make_admin("availability_add_cap"))

        response = self.client.post(
            reverse("admin:shelters_shelteravailability_add"),
            {"shelter": str(shelter.pk), "non_restricted_beds": 9, "restricted_beds": 0, "restriction_notes": ""},
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(ShelterAvailability.objects.filter(shelter=shelter).exists())


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
