from django.contrib.gis.geos import Point
from django.test import TestCase
from shelters.enums import ServiceEnum
from shelters.models import (
    Location,
    Population,
    Requirement,
    Service,
    Shelter,
    ShelterType,
)
from test_utils.mixins import GraphQLTestCaseMixin


class ShelterQueryTestCase(GraphQLTestCaseMixin, TestCase):
    def setUp(self) -> None:
        super().setUp()

        shelter1_data = {
            'title': 'Shelter-1',
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
        ShelterType.objects.create(title='Emergency Shelter', shelter=shelter1).save()
        Service.objects.create(title='Mail', shelter=shelter1).save()
        Service.objects.create(title='Showers', shelter=shelter1).save()
        Population.objects.create(title='Men', shelter=shelter1).save()
        Population.objects.create(title='Women', shelter=shelter1).save()
        Requirement.objects.create(title='Veteran', shelter=shelter1).save()
        Requirement.objects.create(title='Medicaid or Medicare',
                                   shelter=shelter1).save()

        location = Location(point=Point(5.152149, 46.199615), address='1234 Main St.')
        location.save()

        shelter1.location = location
        shelter1.save()

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
                populations
                services
            }
        }
        """

        expected_response = {'shelters': [{'id': '1',
                'location': {'latitude': 5.152149, 'longitude': 46.199615},
                'populations': ['Men', 'Women'],
                'services': ['Mail', 'Showers'],
                'title': 'Shelter-1'}]}

        response = self.execute_graphql(query)

        self.assertEqual(len(response['data']['shelters']), 1)
        self.assertEqual(response['data'], expected_response)

