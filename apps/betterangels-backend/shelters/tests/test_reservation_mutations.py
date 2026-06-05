from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from shelters.models import Reservation
from shelters.tests.baker_recipes import shelter_recipe


class DeleteReservationTestCase(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        reservation_content_type = ContentType.objects.get_for_model(Reservation)
        delete_reservation_perm = Permission.objects.get(
            content_type=reservation_content_type, codename="delete_reservation"
        )
        self.org_1_case_manager_1.user_permissions.add(delete_reservation_perm)
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_delete_reservation(self) -> None:
        shelter = shelter_recipe.make(organization=self.org_1)
        reservation = Reservation.objects.create(shelter=shelter)

        mutation = """
            mutation DeleteReservation($data: DeleteDjangoObjectInput!) {
                deleteReservation(data: $data) {
                    ... on ReservationType {
                        id
                    }
                }
            }
        """
        variables = {"data": {"id": reservation.pk}}

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        self.assertFalse(Reservation.objects.filter(pk=reservation.pk).exists())

    def test_delete_reservation_not_permitted(self) -> None:
        shelter = shelter_recipe.make(organization=self.org_1)
        reservation = Reservation.objects.create(shelter=shelter)

        self.org_1_case_manager_1.user_permissions.clear()
        self.graphql_client.force_login(self.org_1_case_manager_1)

        mutation = """
            mutation DeleteReservation($data: DeleteDjangoObjectInput!) {
                deleteReservation(data: $data) {
                    ... on ReservationType {
                        id
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            message
                        }
                    }
                }
            }
        """
        variables = {"data": {"id": reservation.pk}}

        self.execute_graphql(mutation, variables)
        self.assertTrue(Reservation.objects.filter(pk=reservation.pk).exists())
