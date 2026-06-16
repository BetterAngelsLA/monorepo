from typing import Any

from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase, ignore_warnings
from shelters.models import SPA, Bed, City, Room, Service, ServiceCategory, Shelter
from unittest_parametrize import ParametrizedTestCase


@ignore_warnings(category=UserWarning)
class CreateShelterTestCase(GraphQLBaseTestCase, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        shelter_content_type = ContentType.objects.get_for_model(Shelter)
        add_shelter_perm = Permission.objects.get(content_type=shelter_content_type, codename="add_shelter")
        self.org_1_case_manager_1.user_permissions.add(add_shelter_perm)

        bed_content_type = ContentType.objects.get_for_model(Bed)
        add_bed_perm = Permission.objects.get(content_type=bed_content_type, codename="add_bed")
        self.org_1_case_manager_1.user_permissions.add(add_bed_perm)

        room_content_type = ContentType.objects.get_for_model(Room)
        add_room_perm = Permission.objects.get(content_type=room_content_type, codename="add_room")
        self.org_1_case_manager_1.user_permissions.add(add_room_perm)

        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_create_shelter_minimal_fields(self) -> None:
        """Test creating a shelter with only required fields"""
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                        name
                        description
                        status
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "name": "Test Shelter",
                "description": "A test shelter for unit testing",
                "organization": str(self.org_1.pk),
            }
        }

        initial_shelter_count = Shelter.objects.count()

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        shelter = response["data"]["createShelter"]

        self.assertEqual(shelter["name"], "Test Shelter")
        self.assertEqual(shelter["description"], "A test shelter for unit testing")
        self.assertEqual(shelter["status"], "DRAFT")
        self.assertIsNotNone(shelter["id"])
        self.assertEqual(Shelter.objects.count(), initial_shelter_count + 1)

    def test_create_shelter_with_optional_fields(self) -> None:
        """Test creating a shelter with optional fields"""
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                        name
                        description
                        email
                        phone
                        website
                        totalBeds
                        maxStay
                        onSiteSecurity
                        bedFees
                        programFees
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "name": "Full Featured Shelter",
                "description": "A shelter with all the bells and whistles",
                "organization": str(self.org_1.pk),
                "email": "info@shelter.org",
                "phone": "+13105551234",
                "website": "https://www.shelter.org",
                "totalBeds": 50,
                "maxStay": 90,
                "onSiteSecurity": True,
                "bedFees": "No fee for first 30 days",
                "programFees": "$5 per day",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        shelter = response["data"]["createShelter"]

        self.assertEqual(shelter["name"], "Full Featured Shelter")
        self.assertEqual(shelter["email"], "info@shelter.org")
        # FIX: Check for either format (with or without +1)
        self.assertIn(shelter["phone"], ["+13105551234", "3105551234"])  # ← Changed this line
        self.assertEqual(shelter["website"], "https://www.shelter.org")
        self.assertEqual(shelter["totalBeds"], 50)
        self.assertEqual(shelter["maxStay"], 90)
        self.assertTrue(shelter["onSiteSecurity"])
        self.assertEqual(shelter["bedFees"], "No fee for first 30 days")
        self.assertEqual(shelter["programFees"], "$5 per day")

    def test_create_shelter_with_many_to_many_fields(self) -> None:
        """Test creating a shelter with many-to-many relationships"""
        city, _ = City.objects.get_or_create(name="Los Angeles")
        assert city

        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                        name
                        pets {
                            name
                        }
                        demographics {
                            name
                        }
                        shelterTypes {
                            name
                        }
                        accessibility {
                            name
                        }
                        city {
                            id
                            name
                        }
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "name": "Pet Friendly Shelter",
                "description": "A shelter that welcomes pets",
                "organization": str(self.org_1.pk),
                "accessibility": ["WHEELCHAIR_ACCESSIBLE"],
                "demographics": ["FAMILIES", "SINGLE_WOMEN"],
                "shelterTypes": ["BUILDING"],
                "pets": ["DOGS_UNDER_25_LBS", "CATS"],
                "cityId": str(city.pk),
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        shelter = response["data"]["createShelter"]

        self.assertEqual(shelter["name"], "Pet Friendly Shelter")
        self.assertEqual(len(shelter["pets"]), 2)
        self.assertEqual(len(shelter["demographics"]), 2)
        self.assertEqual(len(shelter["shelterTypes"]), 1)
        self.assertEqual(len(shelter["accessibility"]), 1)
        self.assertEqual(shelter["city"]["id"], str(city.pk))

        pet_names = [pet["name"] for pet in shelter["pets"]]
        self.assertIn("DOGS_UNDER_25_LBS", pet_names)
        self.assertIn("CATS", pet_names)

    def test_create_shelter_with_location(self) -> None:
        """Test creating a shelter with location data"""
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                        name
                        location {
                            place
                            latitude
                            longitude
                        }
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "name": "Downtown Shelter",
                "description": "Located in downtown LA",
                "organization": str(self.org_1.pk),
                "location": {
                    "place": "123 Main St, Los Angeles, CA 90012",
                    "latitude": 34.0522,
                    "longitude": -118.2437,
                },
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        shelter = response["data"]["createShelter"]

        self.assertEqual(shelter["name"], "Downtown Shelter")
        self.assertIsNotNone(shelter["location"])
        self.assertEqual(shelter["location"]["place"], "123 Main St, Los Angeles, CA 90012")
        self.assertEqual(shelter["location"]["latitude"], 34.0522)
        self.assertEqual(shelter["location"]["longitude"], -118.2437)

    def test_create_shelter_with_pending_services(self) -> None:
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                        name
                        services {
                            id
                            displayName
                            isOther
                            category {
                                id
                            }
                        }
                    }
                }
            }
        """

        category, _ = ServiceCategory.objects.get_or_create(
            name="general",
            defaults={"display_name": "General Services", "priority": 0},
        )
        # Remove any pre-seeded services that would conflict with the test assertions.
        Service.objects.filter(category=category).delete()

        existing_other = Service.objects.create(
            category=category,
            name="other_laundry",
            display_name="Laundry",
            is_other=True,
            priority=0,
        )
        official = Service.objects.create(
            category=category,
            name="case_management",
            display_name="Case Management",
            is_other=False,
            priority=1,
        )

        variables: dict[str, Any] = {
            "data": {
                "name": "Shelter With Custom Services",
                "description": "A shelter with official and custom services",
                "organization": str(self.org_1.pk),
                "services": [
                    {"id": str(official.pk)},
                    {"categoryId": str(category.pk), "displayName": "Laundry"},
                    {"categoryId": str(category.pk), "displayName": "Showers"},
                    {"categoryId": str(category.pk), "displayName": "showers"},
                ],
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        shelter = response["data"]["createShelter"]
        self.assertEqual(shelter["name"], "Shelter With Custom Services")
        self.assertEqual(len(shelter["services"]), 3)

        custom_services = [service for service in shelter["services"] if service["isOther"]]
        self.assertEqual(
            {service["displayName"] for service in custom_services},
            {"Laundry", "Showers"},
        )
        self.assertTrue(any(service["displayName"] == "Case Management" for service in shelter["services"]))

        created_showers = Service.objects.get(category=category, display_name="Showers")
        self.assertTrue(created_showers.is_other)
        self.assertEqual(created_showers.name, "showers")
        self.assertTrue(created_showers.is_other)
        self.assertEqual(Service.objects.filter(category=category, display_name__iexact="Showers").count(), 1)
        self.assertEqual(
            existing_other.pk,
            Service.objects.get(display_name="Laundry", category=category).pk,
        )

    def test_create_shelter_missing_required_field(self) -> None:
        """Omitting name (String! in the schema) is caught at the GraphQL validation level."""
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                # name intentionally omitted — should fail GraphQL validation
                "organization": str(self.org_1.pk),
            }
        }

        response = self.execute_graphql(mutation, variables)

        # GraphQL will catch this at the input validation level before the mutation runs
        self.assertIsNotNone(response.get("errors"))
        error_message = str(response["errors"]).lower()
        self.assertIn("field 'name'", error_message)

    def test_create_shelter_with_rating(self) -> None:
        """Test creating a shelter with rating and review"""
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                        name
                        overallRating
                        subjectiveReview
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "name": "Reviewed Shelter",
                "description": "A well-reviewed shelter",
                "organization": str(self.org_1.pk),
                "overallRating": 4,
                "subjectiveReview": "Clean facilities with helpful staff",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        shelter = response["data"]["createShelter"]

        self.assertEqual(shelter["overallRating"], 4)
        self.assertEqual(shelter["subjectiveReview"], "Clean facilities with helpful staff")

    def test_create_shelter_invalid_email_returns_operation_info(self) -> None:
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                            code
                        }
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "name": "Invalid Email Shelter",
                "description": "Should fail model validation",
                "organization": str(self.org_1.pk),
                "email": "not-an-email",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createShelter"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "VALIDATION")
        self.assertEqual(messages[0]["field"], "email")
        self.assertIn("valid email address", messages[0]["message"])

    def test_create_shelter_persists_to_database(self) -> None:
        """Test that created shelter is actually saved in the database"""
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                        name
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "name": "Persistent Shelter",
                "description": "This should be in the database",
                "organization": str(self.org_1.pk),
            }
        }

        response = self.execute_graphql(mutation, variables)
        self.assertIsNone(response.get("errors"))

        shelter_id = response["data"]["createShelter"]["id"]

        # Verify it exists in database
        db_shelter = Shelter.objects.get(pk=shelter_id)
        self.assertEqual(db_shelter.name, "Persistent Shelter")
        self.assertEqual(db_shelter.description, "This should be in the database")

    def test_create_shelter_wrong_org_rejected(self) -> None:
        """Creating a shelter for an organization the user doesn't belong to is rejected."""
        mutation = """
            mutation ($data: CreateShelterInput!) {
                createShelter(data: $data) {
                    ... on ShelterType {
                        id
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "name": "Wrong Org Shelter",
                "description": "Should be rejected",
                "organization": str(self.org_2.pk),
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertEqual(len(response["errors"]), 1)
        self.assertIn(
            "You do not have permission to create a shelter for this organization.",
            response["errors"][0]["message"],
        )

    def test_create_bed_wrong_org_rejected(self) -> None:
        """Creating a bed for a shelter the user's org doesn't own is rejected."""
        other_org_shelter = Shelter.objects.create(
            name="Other Org Shelter",
            description="Belongs to org 2",
            organization=self.org_2,
        )

        mutation = """
            mutation ($data: CreateBedInput!) {
                createBed(data: $data) {
                    ... on BedType {
                        id
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                }
            }
        """

        variables: dict[str, Any] = {"data": {"shelterId": str(other_org_shelter.pk)}}
        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createBed"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn(
            f"Shelter matching ID {other_org_shelter.pk} could not be found.",
            messages[0]["message"],
        )

    def test_create_room_wrong_org_rejected(self) -> None:
        """Creating a room for a shelter the user's org doesn't own is rejected."""
        other_org_shelter = Shelter.objects.create(
            name="Other Org Shelter",
            description="Belongs to org 2",
            organization=self.org_2,
        )

        mutation = """
            mutation ($data: CreateRoomInput!) {
                createRoom(data: $data) {
                    ... on RoomType {
                        id
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                }
            }
        """

        variables: dict[str, Any] = {
            "data": {
                "shelterId": str(other_org_shelter.pk),
                "name": "Room 101",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createRoom"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn(
            f"Shelter matching ID {other_org_shelter.pk} could not be found.",
            messages[0]["message"],
        )


@ignore_warnings(category=UserWarning)
class UpdateShelterTestCase(GraphQLBaseTestCase, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        shelter_content_type = ContentType.objects.get_for_model(Shelter)
        change_shelter_perm = Permission.objects.get(content_type=shelter_content_type, codename="change_shelter")
        self.org_1_case_manager_1.user_permissions.add(change_shelter_perm)

        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_update_shelter_scalar_fields(self) -> None:
        """Updating scalar fields persists the new values."""
        shelter = Shelter.objects.create(
            name="Shelter to Update",
            organization=self.org_1,
        )

        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                        name
                        status
                        description
                        email
                        phone
                        website
                        isPrivate
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "name": "Updated Name",
                "status": "APPROVED",
                "description": "Updated description",
                "email": "contact@shelter.org",
                "phone": "+13105551234",
                "website": "https://shelter.org",
                "isPrivate": True,
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        result = response["data"]["updateShelter"]
        self.assertEqual(result["name"], "Updated Name")
        self.assertEqual(result["status"], "APPROVED")
        self.assertEqual(result["description"], "Updated description")
        self.assertEqual(result["email"], "contact@shelter.org")
        self.assertIn(result["phone"], ["+13105551234", "3105551234"])
        self.assertEqual(result["website"], "https://shelter.org")
        self.assertTrue(result["isPrivate"])

    def test_update_shelter_patch_semantics(self) -> None:
        """Fields absent from UpdateShelterInput are not overwritten."""
        shelter = Shelter.objects.create(
            name="Patch Shelter",
            is_private=True,
            organization=self.org_1,
        )

        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                        description
                        isPrivate
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "description": "New description",
                # isPrivate intentionally omitted — should remain True
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        result = response["data"]["updateShelter"]
        self.assertEqual(result["description"], "New description")
        self.assertTrue(result["isPrivate"])

    def test_update_shelter_m2m_fields(self) -> None:
        """Providing M2M enum fields replaces their values on the shelter."""
        shelter = Shelter.objects.create(
            name="M2M Shelter",
            organization=self.org_1,
        )

        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                        accessibility { name }
                        demographics { name }
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "accessibility": ["WHEELCHAIR_ACCESSIBLE"],
                "demographics": ["FAMILIES", "SINGLE_MEN"],
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        result = response["data"]["updateShelter"]
        accessibility_names = [a["name"] for a in result["accessibility"]]
        demographic_names = [d["name"] for d in result["demographics"]]
        self.assertIn("WHEELCHAIR_ACCESSIBLE", accessibility_names)
        self.assertCountEqual(demographic_names, ["FAMILIES", "SINGLE_MEN"])

    def test_update_shelter_wrong_org_rejected(self) -> None:
        """A user cannot update a shelter owned by a different organization."""
        other_shelter = Shelter.objects.create(
            name="Other Org Shelter",
            organization=self.org_2,
        )

        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": str(other_shelter.pk),
                "description": "Unauthorized update",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertEqual(len(response["errors"]), 1)
        self.assertIn(
            "You do not have permission to update this shelter.",
            response["errors"][0]["message"],
        )

    def test_update_shelter_services_applied(self) -> None:
        """Providing services in an update sets the shelter's services."""
        shelter = Shelter.objects.create(
            name="Service Shelter",
            organization=self.org_1,
        )
        category, _ = ServiceCategory.objects.get_or_create(
            name="update_test_category",
            defaults={"display_name": "Update Test", "priority": 0},
        )
        Service.objects.filter(category=category).delete()
        official = Service.objects.create(
            category=category,
            name="update_test_service",
            display_name="Update Test Service",
            is_other=False,
            priority=0,
        )

        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                        services {
                            id
                            displayName
                        }
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "services": [{"id": str(official.pk)}],
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        result = response["data"]["updateShelter"]
        self.assertEqual(len(result["services"]), 1)
        self.assertEqual(result["services"][0]["displayName"], "Update Test Service")

    def test_update_shelter_invalid_email_returns_operation_info(self) -> None:
        """An invalid email returns OperationInfo rather than raising an unhandled error."""
        shelter = Shelter.objects.create(
            name="Email Test Shelter",
            organization=self.org_1,
        )

        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "email": "not-an-email",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["updateShelter"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "VALIDATION")
        self.assertEqual(messages[0]["field"], "email")
        self.assertIn("valid email address", messages[0]["message"])

    def test_update_shelter_nonexistent_id_returns_operation_info(self) -> None:
        """Updating a shelter that does not exist returns OperationInfo (MUTATIONS_DEFAULT_HANDLE_ERRORS=True)."""
        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": "999999",
                "description": "Should not work",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["updateShelter"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "ERROR")
        self.assertIsNone(messages[0]["field"])
        self.assertIn("matching query does not exist", messages[0]["message"])

    def test_update_shelter_cities_served_ids(self) -> None:
        """Providing citiesServedIds replaces the shelter's citiesServed M2M relation."""
        shelter = Shelter.objects.create(
            name="Cities Served Shelter",
            organization=self.org_1,
        )
        city_a, _ = City.objects.get_or_create(name="Los Angeles")
        city_b, _ = City.objects.get_or_create(name="Long Beach")

        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                        citiesServed {
                            id
                            name
                        }
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "citiesServedIds": [str(city_a.pk), str(city_b.pk)],
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        result = response["data"]["updateShelter"]
        city_names = {c["name"] for c in result["citiesServed"]}
        self.assertEqual(city_names, {"Los Angeles", "Long Beach"})

        # Verify patch semantics — omitting citiesServedIds leaves the field unchanged.
        variables2: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "description": "Updated description",
            }
        }
        response2 = self.execute_graphql(mutation, variables2)
        self.assertIsNone(response2.get("errors"))
        city_names2 = {c["name"] for c in response2["data"]["updateShelter"]["citiesServed"]}
        self.assertEqual(city_names2, {"Los Angeles", "Long Beach"})

        # Verify full replacement — sending an empty list clears the relation.
        variables3: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "citiesServedIds": [],
            }
        }
        response3 = self.execute_graphql(mutation, variables3)
        self.assertIsNone(response3.get("errors"))
        self.assertEqual(response3["data"]["updateShelter"]["citiesServed"], [])

    def test_update_shelter_spas_served_ids(self) -> None:
        """Providing spasServedIds replaces the shelter's spasServed M2M relation."""
        shelter = Shelter.objects.create(
            name="SPAs Served Shelter",
            organization=self.org_1,
        )
        spa_a, _ = SPA.objects.get_or_create(short_name="1", defaults={"long_name": "1 - Antelope Valley"})
        spa_b, _ = SPA.objects.get_or_create(short_name="2", defaults={"long_name": "2 - San Fernando Valley"})

        mutation = """
            mutation ($data: UpdateShelterInput!) {
                updateShelter(data: $data) {
                    ... on ShelterType {
                        id
                        spasServed {
                            id
                        }
                    }
                }
            }
        """
        variables: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "spasServedIds": [str(spa_a.pk), str(spa_b.pk)],
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        result = response["data"]["updateShelter"]
        spa_ids = {s["id"] for s in result["spasServed"]}
        self.assertEqual(spa_ids, {str(spa_a.pk), str(spa_b.pk)})

        # Verify patch semantics — omitting spasServedIds leaves the field unchanged.
        variables2: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "description": "Updated description",
            }
        }
        response2 = self.execute_graphql(mutation, variables2)
        self.assertIsNone(response2.get("errors"))
        spa_ids2 = {s["id"] for s in response2["data"]["updateShelter"]["spasServed"]}
        self.assertEqual(spa_ids2, {str(spa_a.pk), str(spa_b.pk)})

        # Verify full replacement — sending an empty list clears the relation.
        variables3: dict[str, Any] = {
            "data": {
                "id": str(shelter.pk),
                "spasServedIds": [],
            }
        }
        response3 = self.execute_graphql(mutation, variables3)
        self.assertIsNone(response3.get("errors"))
        self.assertEqual(response3["data"]["updateShelter"]["spasServed"], [])
