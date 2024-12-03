from typing import Optional
import strawberry
import strawberry_django
from common.graphql.types import PhoneNumberScalar
from shelters.models import Shelter
from strawberry import ID, auto


@strawberry.type
class ShelterLocationType:
    place: str
    latitude: float
    longitude: float


@strawberry_django.type(Shelter)
class ShelterType:
    id: ID
    accessibility: auto
    bed_fees: Optional[str]
    cities: auto
    city_council_district: auto
    curfew: auto
    demographics: auto
    demographics_other: auto
    description: str
    email: auto
    entry_info: Optional[str]
    entry_requirements: auto
    funders: auto
    funders_other: auto
    general_services: auto
    health_services: auto
    immediate_needs: auto
    location: ShelterLocationType
    max_stay: auto
    name: auto
    on_site_security: auto
    organization: auto
    other_rules: Optional[str]
    other_services: Optional[str]
    overall_rating: auto
    parking: auto
    pets: auto
    phone: PhoneNumberScalar  # type: ignore
    program_fees: Optional[str]
    room_styles: auto
    room_styles_other: auto
    shelter_programs: auto
    shelter_programs_other: auto
    shelter_types: auto
    shelter_types_other: auto
    spa: auto
    special_situation_restrictions: auto
    status: auto
    storage: auto
    subjective_review: Optional[str]
    supervisorial_district: auto
    total_beds: auto
    training_services: auto
    website: auto
