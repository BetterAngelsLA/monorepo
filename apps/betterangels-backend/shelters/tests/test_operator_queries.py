import datetime
from typing import Any, cast

from accounts.tests.baker_recipes import organization_recipe
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase, parametrize

from shelters.enums import (
    DemographicChoices,
    PetChoices,
    ReservationStatusChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
)
from shelters.enums import ShelterChoices as ShelterTypeChoices
from shelters.models import Bed, Demographic, Pet, Reservation, Shelter, ShelterType, SpecialSituationRestriction
from shelters.models.shelter import ACTIVE_RESERVATION_STATUSES
from shelters.tests.baker_recipes import shelter_recipe


class OperatorShelterQueryTestCase(GraphQLBaseTestCase):
    OPERATOR_SHELTERS_QUERY = """
        query OperatorShelters($orgIds: [ID!], $offset: Int, $limit: Int) {
            operatorShelters(
                filters: { organizations: $orgIds }
                ordering: [{ createdAt: DESC }]
                pagination: { offset: $offset, limit: $limit }
            ) {
                totalCount
                pageInfo { offset limit }
                results { id name }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self._add_shelter_view_permission()
        self.shelter = shelter_recipe.make(organization=self.org_1)

    def _add_shelter_view_permission(self) -> None:
        # Grant view_shelter to the CASEWORKER permission group so the
        # user inherits it through their org role.  HasOrgPerm checks
        # the group's permissions at query time.
        from notes.groups import CASEWORKER

        app_label, codename = Shelter.perms.VIEW.split(".")
        perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        self.org_1.permission_groups.get(template__name=CASEWORKER.name).group.permissions.add(perm)

    def test_operator_shelters_filter_by_organization(self) -> None:
        """Only shelters for the specified organization are returned."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter_2 = shelter_recipe.make(organization=self.org_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_1.id)], "offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 2)

        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(
            returned_ids,
            {str(self.shelter.id), str(shelter_2.id)},
        )

    def test_operator_shelters_returns_all_accessible_orgs_when_no_filter(self) -> None:
        """Without an org filter, returns shelters for all orgs the user belongs to."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter_2 = shelter_recipe.make(organization=self.org_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        # org_1_case_manager_1 belongs to org_1 only
        self.assertEqual(payload["totalCount"], 2)
        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(
            returned_ids,
            {str(self.shelter.id), str(shelter_2.id)},
        )

    def test_operator_shelters_excludes_non_member_org(self) -> None:
        """Filtering by an org the user doesn't belong to returns empty results."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"orgIds": [str(self.org_2.id)], "offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 0)
        self.assertEqual(payload["results"], [])

    def test_operator_shelters_multi_org_user_sees_org_1_shelters(self) -> None:
        """A user belonging to multiple orgs sees shelters from the org in the header."""
        self.org_2.add_user(self.org_1_case_manager_1)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter_2 = shelter_recipe.make(organization=self.org_1)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 2)
        returned_ids = {r["id"] for r in payload["results"]}
        self.assertSetEqual(
            returned_ids,
            {str(self.shelter.id), str(shelter_2.id)},
        )

    def test_operator_shelters_multi_org_user_sees_org_2_shelters(self) -> None:
        """When the header changes, the same user sees the other org's shelters."""
        from accounts.role_manager import OrgRoleManager
        from notes.groups import CASEWORKER

        self.org_2.add_user(self.org_1_case_manager_1)
        OrgRoleManager(self.org_2).add_roles(self.org_1_case_manager_1, CASEWORKER)

        # Grant view_shelter to the CASEWORKER group in org_2
        app_label, codename = Shelter.perms.VIEW.split(".")
        perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        self.org_2.permission_groups.get(template__name=CASEWORKER.name).group.permissions.add(perm)

        self._set_active_org(self.org_2)
        self.graphql_client.force_login(self.org_1_case_manager_1)
        org_2_shelter = shelter_recipe.make(organization=self.org_2)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(org_2_shelter.id))

    def test_operator_shelters_unauthenticated(self) -> None:
        """Unauthenticated requests are rejected."""
        self.graphql_client.logout()

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        self.assertGraphQLUnauthenticated(response)

    def test_operator_shelters_without_permission(self) -> None:
        """Users without shelter view permission are rejected."""
        self.graphql_client.force_login(self.non_case_manager_user)

        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_QUERY,
            variables={"offset": 0, "limit": 10},
        )

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertIn(
            "You do not have permission to perform this action in this organization.",
            response["errors"][0]["message"],
        )

    def test_operator_shelters_filter_by_properties(self) -> None:
        """Property filters narrow results through the operator endpoint."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter_2 = shelter_recipe.make(organization=self.org_1)

        pet_cats, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        self.shelter.pets.set([pet_cats])
        shelter_2.pets.clear()

        query = """
            query OperatorShelters($orgIds: [ID!], $properties: ShelterPropertyInput) {
                operatorShelters(
                    filters: { organizations: $orgIds, properties: $properties }
                ) {
                    totalCount
                    results { id }
                }
            }
        """
        response = self.execute_graphql(
            query,
            variables={
                "orgIds": [str(self.org_1.id)],
                "properties": {"pets": [PetChoices.CATS.name]},
            },
        )

        payload = response["data"]["operatorShelters"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.shelter.id))

    def test_operator_shelters_beds_by_status(self) -> None:
        """Bed counts are returned grouped by status."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        shelter = self.shelter

        baker.make(Bed, shelter=shelter, maintenance_flag=True)
        # Create a bed in turnaround: old last_cleaned with a completed reservation after it
        turnaround_bed = baker.make(
            Bed, shelter=shelter, last_cleaned=datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)
        )
        baker.make(
            Reservation,
            bed=turnaround_bed,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=datetime.datetime.now(datetime.timezone.utc),
        )
        baker.make(Bed, shelter=shelter)
        unavailable_beds = baker.make(Bed, shelter=shelter, _quantity=3)

        for pair in zip(unavailable_beds, ACTIVE_RESERVATION_STATUSES):
            baker.make(Reservation, bed=pair[0], status=pair[1])

        query = """
            query OperatorShelters($orgIds: [ID!]) {
                operatorShelters(filters: { organizations: $orgIds }) {
                    results {
                        id
                        bedCounts {
                            available
                            inTurnaround
                            occupied
                            outOfService
                            reserved
                            total
                        }
                    }
                }
            }
        """
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"orgIds": [str(self.org_1.id)]})
        results = response["data"]["operatorShelters"]["results"]
        shelter_data = next(r for r in results if r["id"] == str(shelter.id))
        self.assertEqual(
            shelter_data["bedCounts"],
            {"available": 1, "occupied": 1, "reserved": 2, "outOfService": 1, "inTurnaround": 1, "total": 6},
        )

    def test_operator_shelters_beds_by_status_no_beds(self) -> None:
        """Shelter with no beds returns all zeros for beds by status."""
        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query OperatorShelters($orgIds: [ID!]) {
                operatorShelters(filters: { organizations: $orgIds }) {
                    results {
                        id
                        bedCounts {
                            available
                            inTurnaround
                            occupied
                            outOfService
                            reserved
                            total
                        }
                    }
                }
            }
        """
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"orgIds": [str(self.org_1.id)]})
        results = response["data"]["operatorShelters"]["results"]
        for result in results:
            self.assertEqual(
                result["bedCounts"],
                {"available": 0, "occupied": 0, "reserved": 0, "outOfService": 0, "inTurnaround": 0, "total": 0},
            )

    def test_operator_shelters_order_by_status(self) -> None:
        """operatorShelters orders by lifecycle rank via ``ShelterOrder.status``."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.shelter.status = StatusChoices.APPROVED
        self.shelter.save()
        shelter_recipe.make(organization=self.org_1, name="Pending Shelter", status=StatusChoices.PENDING)
        shelter_recipe.make(organization=self.org_1, name="Draft Shelter", status=StatusChoices.DRAFT)
        shelter_recipe.make(organization=self.org_1, name="Inactive Shelter", status=StatusChoices.INACTIVE)

        query = """
            query OperatorShelters($orgIds: [ID!], $ordering: [ShelterOrder!]! = []) {
                operatorShelters(filters: { organizations: $orgIds }, ordering: $ordering) {
                    results { id status }
                }
            }
        """
        workflow_order = [
            StatusChoices.DRAFT.name,
            StatusChoices.PENDING.name,
            StatusChoices.APPROVED.name,
            StatusChoices.INACTIVE.name,
        ]

        asc_response = self.execute_graphql(
            query,
            variables={"orgIds": [str(self.org_1.id)], "ordering": {"status": "ASC"}},
        )
        self.assertEqual(
            [r["status"] for r in asc_response["data"]["operatorShelters"]["results"]],
            workflow_order,
        )

        desc_response = self.execute_graphql(
            query,
            variables={"orgIds": [str(self.org_1.id)], "ordering": {"status": "DESC"}},
        )
        self.assertEqual(
            [r["status"] for r in desc_response["data"]["operatorShelters"]["results"]],
            list(reversed(workflow_order)),
        )

    def test_operator_shelters_order_by_bed_count(self) -> None:
        """operatorShelters orders by bed count matching ``bedCounts.total``.

        Zero-bed shelters must sort as 0 (not NULL), so DESC puts them last
        and ASC puts them first.
        """
        self.graphql_client.force_login(self.org_1_case_manager_1)
        # self.shelter has no beds (total 0); give the others distinct counts.
        shelters = [
            shelter_recipe.make(organization=self.org_1, name="Alpha"),
            shelter_recipe.make(organization=self.org_1, name="Beta"),
            shelter_recipe.make(organization=self.org_1, name="Gamma"),
        ]
        baker.make(Bed, shelter=shelters[0], _quantity=5)
        baker.make(Bed, shelter=shelters[1], _quantity=1)
        baker.make(Bed, shelter=shelters[2], _quantity=3)

        query = """
            query OperatorShelters($orgIds: [ID!], $ordering: [ShelterOrder!]! = []) {
                operatorShelters(filters: { organizations: $orgIds }, ordering: $ordering) {
                    results { id bedCounts { total } }
                }
            }
        """
        desc_response = self.execute_graphql(
            query,
            variables={"orgIds": [str(self.org_1.id)], "ordering": {"bedCount": "DESC"}},
        )
        desc_results = desc_response["data"]["operatorShelters"]["results"]
        self.assertEqual(
            [r["id"] for r in desc_results],
            [
                str(shelters[0].id),
                str(shelters[2].id),
                str(shelters[1].id),
                str(self.shelter.id),
            ],
        )
        self.assertEqual(
            [r["bedCounts"]["total"] for r in desc_results],
            [5, 3, 1, 0],
        )

        asc_response = self.execute_graphql(
            query,
            variables={"orgIds": [str(self.org_1.id)], "ordering": {"bedCount": "ASC"}},
        )
        asc_results = asc_response["data"]["operatorShelters"]["results"]
        self.assertEqual(
            [r["id"] for r in asc_results],
            [
                str(self.shelter.id),
                str(shelters[1].id),
                str(shelters[2].id),
                str(shelters[0].id),
            ],
        )
        self.assertEqual(
            [r["bedCounts"]["total"] for r in asc_results],
            [0, 1, 3, 5],
        )

    def test_operator_shelters_order_by_bed_count_with_m2m_filter(self) -> None:
        """bedCount ordering stays correct when an M2M filter would inflate JOINs."""
        from shelters.models import City

        self.graphql_client.force_login(self.org_1_case_manager_1)
        city = City.objects.get_or_create(name="Bed Count Filter City")[0]
        other_city = City.objects.get_or_create(name="Other Bed Count City")[0]
        # Ensure setUp shelter does not match the citiesServed filter.
        self.shelter.cities_served.set([other_city])

        high = shelter_recipe.make(organization=self.org_1, name="High Beds", cities_served=[city])
        mid = shelter_recipe.make(organization=self.org_1, name="Mid Beds", cities_served=[city])
        low = shelter_recipe.make(organization=self.org_1, name="Low Beds", cities_served=[city])
        # Extra M2M rows that would inflate a JOIN-based Count if used for ordering.
        high.cities_served.add(other_city)
        mid.cities_served.add(other_city)
        baker.make(Bed, shelter=high, _quantity=5)
        baker.make(Bed, shelter=mid, _quantity=3)
        baker.make(Bed, shelter=low, _quantity=1)
        # Shelter that matches org but not the citiesServed filter.
        excluded = shelter_recipe.make(organization=self.org_1, name="Excluded", cities_served=[other_city])
        baker.make(Bed, shelter=excluded, _quantity=10)

        query = """
            query OperatorShelters(
                $orgIds: [ID!], $cityIds: [ID!], $ordering: [ShelterOrder!]! = []
            ) {
                operatorShelters(
                    filters: { organizations: $orgIds, citiesServed: $cityIds }
                    ordering: $ordering
                ) {
                    results { id bedCounts { total } }
                }
            }
        """
        response = self.execute_graphql(
            query,
            variables={
                "orgIds": [str(self.org_1.id)],
                "cityIds": [str(city.id)],
                "ordering": {"bedCount": "DESC"},
            },
        )
        results = response["data"]["operatorShelters"]["results"]
        self.assertEqual(
            [r["id"] for r in results],
            [str(high.id), str(mid.id), str(low.id)],
        )
        self.assertEqual([r["bedCounts"]["total"] for r in results], [5, 3, 1])

    def test_operator_shelters_order_by_organization(self) -> None:
        """``ShelterOrder.organization`` sorts by org name ASC and DESC.

        Exercised via the public ``shelters`` query because
        ``operatorShelters`` is scoped to the active org (all rows share
        one organization name).
        """
        org_alpha = organization_recipe.make(name="Alpha Org")
        org_zeta = organization_recipe.make(name="Zeta Org")
        shelter_zeta = baker.make(
            Shelter,
            organization=org_zeta,
            name="Z Shelter",
            status=StatusChoices.APPROVED,
            is_private=False,
        )
        shelter_alpha = baker.make(
            Shelter,
            organization=org_alpha,
            name="A Shelter",
            status=StatusChoices.APPROVED,
            is_private=False,
        )

        query = """
            query ($ordering: [ShelterOrder!]! = []) {
                shelters(ordering: $ordering) {
                    results { id organization { name } }
                }
            }
        """

        asc = self.execute_graphql(
            query,
            variables={"ordering": {"organization": "ASC"}},
        )["data"]["shelters"]["results"]
        asc_ids = [r["id"] for r in asc]
        self.assertLess(asc_ids.index(str(shelter_alpha.id)), asc_ids.index(str(shelter_zeta.id)))

        desc = self.execute_graphql(
            query,
            variables={"ordering": {"organization": "DESC"}},
        )["data"]["shelters"]["results"]
        desc_ids = [r["id"] for r in desc]
        self.assertLess(desc_ids.index(str(shelter_zeta.id)), desc_ids.index(str(shelter_alpha.id)))


class OperatorShelterPropertyFilterTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    """Tests for the `properties` filter on operatorShelters."""

    OPERATOR_SHELTERS_PROPERTY_QUERY = """
        query OperatorSheltersByProperty(
            $organizationId: ID!
            $properties: ShelterPropertyInput
        ) {
            operatorShelters(
                filters: {
                    organizations: [$organizationId]
                    properties: $properties
                }
                ordering: [{ createdAt: DESC }]
            ) {
                totalCount
                results { id }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()

        # HasOrgPerm checks org-scoped permissions, not global Django perms.
        from notes.groups import CASEWORKER

        app_label, codename = Shelter.perms.VIEW.split(".")
        perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        pg = self.org_1.permission_groups.get(template__name=CASEWORKER.name)
        pg.group.permissions.add(perm)

        self.graphql_client.force_login(self.org_1_case_manager_1)

        # Shelters A & B: SINGLE_MEN, VETERANS, BUILDING, SPA ONE
        for _ in range(2):
            shelter_recipe.make(
                organization=self.org_1,
                demographics=[Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)[0]],
                special_situation_restrictions=[
                    SpecialSituationRestriction.objects.get_or_create(name=SpecialSituationRestrictionChoices.VETERANS)[
                        0
                    ]
                ],
                shelter_types=[ShelterType.objects.get_or_create(name=ShelterTypeChoices.BUILDING)[0]],
            )
        # Shelter C: FAMILIES, HIV_AIDS, TINY_HOMES, SPA TWO
        shelter_recipe.make(
            organization=self.org_1,
            demographics=[Demographic.objects.get_or_create(name=DemographicChoices.FAMILIES)[0]],
            special_situation_restrictions=[
                SpecialSituationRestriction.objects.get_or_create(name=SpecialSituationRestrictionChoices.HIV_AIDS)[0]
            ],
            shelter_types=[ShelterType.objects.get_or_create(name=ShelterTypeChoices.TINY_HOMES)[0]],
        )

    def _query(self, properties: dict[str, Any]) -> list[dict[Any, Any]]:
        response = self.execute_graphql(
            self.OPERATOR_SHELTERS_PROPERTY_QUERY,
            variables={"organizationId": str(self.org_1.pk), "properties": properties},
        )
        self.assertIsNone(response.get("errors"))
        return cast(list[dict[Any, Any]], response["data"]["operatorShelters"]["results"])

    @parametrize(
        "properties, expected_count",
        [
            ({"demographics": [DemographicChoices.SINGLE_MEN.name]}, 2),
            ({"demographics": [DemographicChoices.FAMILIES.name]}, 1),
            ({"demographics": [DemographicChoices.SINGLE_MEN.name, DemographicChoices.FAMILIES.name]}, 3),
        ],
    )
    def test_demographics_filter(self, properties: dict[str, Any], expected_count: int) -> None:
        self.assertEqual(len(self._query(properties)), expected_count)

    @parametrize(
        "properties, expected_count",
        [
            ({"specialSituationRestrictions": [SpecialSituationRestrictionChoices.VETERANS.name]}, 2),
            ({"specialSituationRestrictions": [SpecialSituationRestrictionChoices.HIV_AIDS.name]}, 1),
        ],
    )
    def test_special_situation_restrictions_filter(self, properties: dict[str, Any], expected_count: int) -> None:
        self.assertEqual(len(self._query(properties)), expected_count)

    @parametrize(
        "properties, expected_count",
        [
            ({"shelterTypes": [ShelterTypeChoices.BUILDING.name]}, 2),
            ({"shelterTypes": [ShelterTypeChoices.TINY_HOMES.name]}, 1),
        ],
    )
    def test_shelter_types_filter(self, properties: dict[str, Any], expected_count: int) -> None:
        self.assertEqual(len(self._query(properties)), expected_count)

    def test_combined_properties_filter(self) -> None:
        results = self._query(
            {
                "demographics": [DemographicChoices.SINGLE_MEN.name],
                "shelterTypes": [ShelterTypeChoices.BUILDING.name],
            }
        )
        self.assertEqual(len(results), 2)


class ShelterOperatorOrganizationsTestCase(GraphQLBaseTestCase):
    """Tests for the shelterOperatorOrganizations query."""

    QUERY = """
        query ShelterOperatorOrganizations {
            shelterOperatorOrganizations(ordering: [{ name: ASC }]) {
                results { id name }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        # Grant view_shelter to the CASEWORKER group in org_1 so
        # org_1_case_manager_1 passes the HasOrgPerm(Shelter.perms.VIEW) check.
        from notes.groups import CASEWORKER

        app_label, codename = Shelter.perms.VIEW.split(".")
        perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        self.org_1.permission_groups.get(template__name=CASEWORKER.name).group.permissions.add(perm)

    def test_returns_only_shelter_operator_orgs(self) -> None:
        """Returns orgs with a SHELTER_OPERATOR permission group; outreach-only orgs are excluded."""
        from shelters.groups import SHELTER_OPERATOR

        shelter_org_a = organization_recipe.make(
            name="Alpha Shelter", preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,)
        )
        shelter_org_b = organization_recipe.make(
            name="Beta Shelter", preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,)
        )

        self.graphql_client.force_login(self.org_1_case_manager_1)
        response = self.execute_graphql(self.QUERY)

        self.assertIsNone(response.get("errors"))
        result_ids = {r["id"] for r in response["data"]["shelterOperatorOrganizations"]["results"]}

        # org_1 and org_2 use the outreach preset — no SHELTER_OPERATOR group
        self.assertNotIn(str(self.org_1.id), result_ids)
        self.assertNotIn(str(self.org_2.id), result_ids)

        # Shelter preset orgs must appear
        self.assertIn(str(shelter_org_a.id), result_ids)
        self.assertIn(str(shelter_org_b.id), result_ids)

    def test_results_ordered_by_name(self) -> None:
        """Results are sorted alphabetically by name when ordering is requested."""
        from shelters.groups import SHELTER_OPERATOR

        organization_recipe.make(name="Zebra", preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        organization_recipe.make(name="Alpha", preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        organization_recipe.make(name="Middle", preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))

        self.graphql_client.force_login(self.org_1_case_manager_1)
        response = self.execute_graphql(self.QUERY)

        self.assertIsNone(response.get("errors"))
        names = [r["name"] for r in response["data"]["shelterOperatorOrganizations"]["results"]]
        self.assertEqual(names, sorted(names))
        self.assertEqual(
            [n for n in names if n in {"Alpha", "Middle", "Zebra"}],
            ["Alpha", "Middle", "Zebra"],
        )

    def test_unauthenticated_is_rejected(self) -> None:
        """Unauthenticated requests return an authentication error."""
        self.graphql_client.logout()
        response = self.execute_graphql(self.QUERY)
        self.assertGraphQLUnauthenticated(response)

    def test_user_without_shelter_view_permission_is_rejected(self) -> None:
        """Users whose org lacks shelter view permission cannot access the endpoint."""
        self.graphql_client.force_login(self.non_case_manager_user)
        response = self.execute_graphql(self.QUERY)
        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertIn(
            "You do not have permission to perform this action in this organization.",
            response["errors"][0]["message"],
        )
