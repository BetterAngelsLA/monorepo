from django.test import TestCase
from shelters.models import Shelter, Service, Requirement, Population, ShelterType
from test_utils.mixins import GraphQLTestCaseMixin
# Test a query for all
# Test a query with the services field
# Test a query with the blah field
# Test a query with the blah field
# Test a query that doesn't return anything


class ShelterQueryTestCase(GraphQLTestCaseMixin, TestCase):
    def setUp(self) -> None:
        super().setUp()

        shelter_type_1 = ShelterType.objects.create(title='ShelterType-1')
        shelter1_data = {
            'title': 'Shelter-1',
            'shelter_type': shelter_type_1,
            'latitude': 5.152149,
            'longitude': 46.199615,
            'email': 'shelter1@test.com',
            'description': 'Some description',
            'typical_stay_description': 'Some typical stay description',
            'total_beds': 100,
            'available_beds': 50,
            'private_beds': 25,
            'max_stay': 12,
            'average_bed_rate': 500.23,
            'bed_layout_description': 'Some bed layout description'
        }
        shelter1 = Shelter.objects.create(**shelter1_data)

        # Assigning here because can't instantiate object with many-to-many relationship
        services = [Service.objects.create(title='Service-1'),
                    Service.objects.create(title='Service-2')]
        shelter1.services.set(services)

        populations = [Population.objects.create(title='Population-1'),
                       Population.objects.create(title='Population-2')]
        shelter1.population.set(populations)

        requirements = [Requirement.objects.create(title='Requirement-1'),
                        Requirement.objects.create(title='Requirement-2')]
        shelter1.requirements.set(requirements)

    def test_shelters_query(self) -> None:
        query = """
        query {
            shelters {
                id
                title
                location {
                    latitude
                    longitude
                }
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertEqual(len(response['data']['shelters']), 1)
        self.assertEqual(response['data']['shelters'][0]['title'], 'Shelter-1')

    def test_shelters_query_filter(self) -> None:
        services_query = """
        query {
            shelters(filters: {services: {title: "Service-1"}}) {
                title
                services
            }
        }
        """
        response = self.execute_graphql(services_query)
        self.assertEqual(len(response['data']['shelters']), 1)
        self.assertTrue(any(service == 'Service-1'
                            for service in response['data']['shelters'][0]['services']))

        empty_services_query = """
        query {
            shelters(filters: {services: {title: "Not a service"}}) {
                title
                services
            }
        }
        """
        response = self.execute_graphql(empty_services_query)
        self.assertEqual(len(response['data']['shelters']), 0)
