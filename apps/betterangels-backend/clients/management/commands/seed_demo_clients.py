"""Seed demo clients, interactions (notes) and their Los Angeles map locations.

The app's Clients list, a client's Interactions tab and the interaction maps
(the client "Locations" tab) all read from ``clients_clientprofile`` and
``notes_note`` — and each map pin comes from ``notes_note.location_id →
common_location.point``.  A database with no ``common_location`` rows renders
empty maps, so this command creates both halves together.

Design notes
------------
* Idempotent.  Clients are keyed by their deterministic email, notes by
  ``(client_profile, purpose, public_details)``, and locations go through the
  app's own ``Location.get_or_create_location`` dedup (point + address + POI).
  Re-running creates nothing and does not overwrite anything.
* Org/ownership is not invented: the acting ``PermissionGroup`` is resolved
  exactly the way the app resolves it for ``create_note``
  (``get_permission_group_for_org(author, org, template=CASEWORKER)``), so the
  notes land in the same organization the app scopes by and are created through
  the real ``note_create`` service (which also assigns object-level perms).
* Nothing here touches ``accounts_organizationprofile`` (this local DB has
  migration drift and ``time_zone`` is missing).

Usage:
    python manage.py seed_demo_clients
    python manage.py seed_demo_clients --organization-id 2 --author-email admin@example.com
    python manage.py seed_demo_clients --dry-run
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Optional

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction
from django.utils import timezone
from organizations.models import Organization

from accounts.models import PermissionGroup, User
from accounts.selectors import get_permission_group_for_org
from clients.enums import (
    GenderEnum,
    HmisAgencyEnum,
    LanguageEnum,
    LivingSituationEnum,
    MaritalStatusEnum,
    PreferredCommunicationEnum,
    PronounEnum,
    RaceEnum,
    RelationshipTypeEnum,
    VeteranStatusEnum,
)
from clients.models import ClientContact, ClientProfile, HmisProfile
from common.models import Location, PhoneNumber
from notes.groups import CASEWORKER
from notes.models import Note
from notes.services import note_create
from teams.models import Team

# ---------------------------------------------------------------------------
# Real Los Angeles locations (label, latitude, longitude, formatted address)
# spread across the city so the map clusters meaningfully.
# ---------------------------------------------------------------------------

LA_LOCATIONS: dict[str, dict[str, Any]] = {
    "union_rescue_mission": {
        "label": "Union Rescue Mission",
        "latitude": 34.04565,
        "longitude": -118.24475,
        "address": "545 S San Pedro St, Los Angeles, CA 90013",
    },
    "midnight_mission": {
        "label": "The Midnight Mission",
        "latitude": 34.04437,
        "longitude": -118.24436,
        "address": "601 S San Pedro St, Los Angeles, CA 90014",
    },
    "la_mission": {
        "label": "Los Angeles Mission",
        "latitude": 34.04660,
        "longitude": -118.24170,
        "address": "303 E 5th St, Los Angeles, CA 90013",
    },
    "toy_district": {
        "label": "Toy District",
        "latitude": 34.04510,
        "longitude": -118.24040,
        "address": "400 S Los Angeles St, Los Angeles, CA 90013",
    },
    "pershing_square": {
        "label": "Pershing Square",
        "latitude": 34.04810,
        "longitude": -118.25270,
        "address": "532 S Olive St, Los Angeles, CA 90013",
    },
    "echo_park_lake": {
        "label": "Echo Park Lake",
        "latitude": 34.07810,
        "longitude": -118.26060,
        "address": "751 Echo Park Ave, Los Angeles, CA 90026",
    },
    "sunset_junction": {
        "label": "Sunset Junction, Silver Lake",
        "latitude": 34.09000,
        "longitude": -118.26970,
        "address": "4000 W Sunset Blvd, Los Angeles, CA 90029",
    },
    "macarthur_park": {
        "label": "MacArthur Park",
        "latitude": 34.05780,
        "longitude": -118.27470,
        "address": "2230 W 6th St, Los Angeles, CA 90057",
    },
    "westlake_alvarado": {
        "label": "Westlake / Alvarado",
        "latitude": 34.05940,
        "longitude": -118.28340,
        "address": "1700 W 6th St, Los Angeles, CA 90017",
    },
    "koreatown_western": {
        "label": "Koreatown, Wilshire & Western",
        "latitude": 34.06190,
        "longitude": -118.30910,
        "address": "3600 Wilshire Blvd, Los Angeles, CA 90010",
    },
    "hollywood_vine": {
        "label": "Hollywood & Vine",
        "latitude": 34.09990,
        "longitude": -118.32670,
        "address": "1600 N Vine St, Los Angeles, CA 90028",
    },
    "hollywood_blvd": {
        "label": "Hollywood Blvd",
        "latitude": 34.10160,
        "longitude": -118.33870,
        "address": "6801 Hollywood Blvd, Los Angeles, CA 90028",
    },
    "los_feliz_vermont": {
        "label": "Los Feliz / Vermont Ave",
        "latitude": 34.10720,
        "longitude": -118.29170,
        "address": "1800 N Vermont Ave, Los Angeles, CA 90027",
    },
    "atwater_glendale_blvd": {
        "label": "Atwater Village",
        "latitude": 34.11820,
        "longitude": -118.25990,
        "address": "3130 Glendale Blvd, Los Angeles, CA 90039",
    },
    "highland_park_york": {
        "label": "Highland Park, York Blvd",
        "latitude": 34.11190,
        "longitude": -118.18570,
        "address": "5600 York Blvd, Los Angeles, CA 90042",
    },
    "lincoln_heights": {
        "label": "Lincoln Heights",
        "latitude": 34.07000,
        "longitude": -118.22000,
        "address": "2300 N Broadway, Los Angeles, CA 90031",
    },
    "chinatown_broadway": {
        "label": "Chinatown, N Broadway",
        "latitude": 34.06370,
        "longitude": -118.23850,
        "address": "900 N Broadway, Los Angeles, CA 90012",
    },
    "boyle_heights_cesar_chavez": {
        "label": "Boyle Heights, Cesar Chavez Ave",
        "latitude": 34.04790,
        "longitude": -118.20900,
        "address": "2700 E Cesar E Chavez Ave, Los Angeles, CA 90033",
    },
    "mariachi_plaza": {
        "label": "Mariachi Plaza",
        "latitude": 34.04740,
        "longitude": -118.21810,
        "address": "1831 1st St, Los Angeles, CA 90033",
    },
    "exposition_park": {
        "label": "Exposition Park / USC",
        "latitude": 34.01860,
        "longitude": -118.28510,
        "address": "700 Exposition Park Dr, Los Angeles, CA 90037",
    },
    "vermont_square": {
        "label": "Vermont Square",
        "latitude": 34.00000,
        "longitude": -118.29170,
        "address": "4712 S Vermont Ave, Los Angeles, CA 90037",
    },
    "crenshaw_mlk": {
        "label": "Crenshaw / Baldwin Hills",
        "latitude": 34.01000,
        "longitude": -118.33450,
        "address": "3650 W Martin Luther King Jr Blvd, Los Angeles, CA 90008",
    },
    "watts_103rd": {
        "label": "Watts, 103rd St",
        "latitude": 33.94360,
        "longitude": -118.24870,
        "address": "10300 Compton Ave, Los Angeles, CA 90002",
    },
    "inglewood_market": {
        "label": "Inglewood, Market St",
        "latitude": 33.96170,
        "longitude": -118.35310,
        "address": "100 E Market St, Inglewood, CA 90301",
    },
    "culver_city_downtown": {
        "label": "Downtown Culver City",
        "latitude": 34.02350,
        "longitude": -118.39370,
        "address": "9500 Culver Blvd, Culver City, CA 90232",
    },
    "venice_boardwalk": {
        "label": "Venice Beach Boardwalk",
        "latitude": 33.98500,
        "longitude": -118.46950,
        "address": "1800 Ocean Front Walk, Venice, CA 90291",
    },
    "santa_monica_pier": {
        "label": "Santa Monica Pier",
        "latitude": 34.00830,
        "longitude": -118.49870,
        "address": "200 Santa Monica Pier, Santa Monica, CA 90401",
    },
    "westwood_weyburn": {
        "label": "Westwood Village",
        "latitude": 34.06880,
        "longitude": -118.44540,
        "address": "10861 Weyburn Ave, Los Angeles, CA 90024",
    },
    "sherman_oaks_ventura": {
        "label": "Sherman Oaks, Ventura Blvd",
        "latitude": 34.15000,
        "longitude": -118.44800,
        "address": "15000 Ventura Blvd, Sherman Oaks, CA 91403",
    },
    "van_nuys_sepulveda": {
        "label": "Van Nuys, Van Nuys Blvd",
        "latitude": 34.18670,
        "longitude": -118.44830,
        "address": "7600 Van Nuys Blvd, Van Nuys, CA 91405",
    },
    "north_hollywood_lankershim": {
        "label": "North Hollywood, Lankershim Blvd",
        "latitude": 34.18700,
        "longitude": -118.38170,
        "address": "5300 Lankershim Blvd, North Hollywood, CA 91601",
    },
    "canoga_park_sherman_way": {
        "label": "Canoga Park, Sherman Way",
        "latitude": 34.20110,
        "longitude": -118.59610,
        "address": "20900 Sherman Way, Canoga Park, CA 91303",
    },
    "reseda_vanowen": {
        "label": "Reseda, Vanowen St",
        "latitude": 34.19390,
        "longitude": -118.53610,
        "address": "19300 Vanowen St, Reseda, CA 91335",
    },
    "pacoima_san_fernando_rd": {
        "label": "Pacoima, San Fernando Rd",
        "latitude": 34.25670,
        "longitude": -118.42340,
        "address": "1000 San Fernando Rd, San Fernando, CA 91340",
    },
    "glendale_brand": {
        "label": "Downtown Glendale",
        "latitude": 34.14630,
        "longitude": -118.25220,
        "address": "200 N Brand Blvd, Glendale, CA 91203",
    },
    "pasadena_union": {
        "label": "Old Pasadena, Union St",
        "latitude": 34.14600,
        "longitude": -118.14950,
        "address": "300 E Union St, Pasadena, CA 91101",
    },
    "el_monte_garvey": {
        "label": "El Monte, Garvey Ave",
        "latitude": 34.06860,
        "longitude": -118.02760,
        "address": "10300 Garvey Ave, El Monte, CA 91733",
    },
    "pomona_holt": {
        "label": "Pomona, E Holt Ave",
        "latitude": 34.06050,
        "longitude": -117.75230,
        "address": "700 E Holt Ave, Pomona, CA 91767",
    },
    "long_beach_pine": {
        "label": "Downtown Long Beach",
        "latitude": 33.77010,
        "longitude": -118.19370,
        "address": "200 Pine Ave, Long Beach, CA 90802",
    },
    "san_pedro_harbor": {
        "label": "San Pedro Harbor",
        "latitude": 33.73950,
        "longitude": -118.27700,
        "address": "500 W 5th St, San Pedro, CA 90731",
    },
    "glassell_park": {
        "label": "Glassell Park",
        "latitude": 34.11360,
        "longitude": -118.23420,
        "address": "3200 Eagle Rock Blvd, Los Angeles, CA 90065",
    },
}


@dataclass(frozen=True)
class InteractionSpec:
    """One seeded Note/interaction."""

    purpose: str
    public_details: str
    private_details: str
    days_ago: int
    location: str
    team: str
    is_submitted: bool = True


@dataclass(frozen=True)
class ClientSpec:
    """One seeded client plus their interactions and light related data."""

    first_name: str
    last_name: str
    date_of_birth: date
    email: str
    california_id: str
    phone: str
    gender: GenderEnum
    race: RaceEnum
    living_situation: LivingSituationEnum
    preferred_language: LanguageEnum
    residence_address: str
    residence_location: str
    interactions: tuple[InteractionSpec, ...]
    middle_name: Optional[str] = None
    nickname: Optional[str] = None
    marital_status: Optional[MaritalStatusEnum] = None
    veteran_status: Optional[VeteranStatusEnum] = None
    pronouns: Optional[PronounEnum] = None
    important_notes: Optional[str] = None
    hmis_id: Optional[str] = None
    contact: Optional[tuple[str, RelationshipTypeEnum, str, str]] = None  # (name, relationship_to_client, phone, email)
    preferred_communication: tuple[PreferredCommunicationEnum, ...] = field(default=())


DEMO_CLIENTS: tuple[ClientSpec, ...] = (
    ClientSpec(
        first_name="Maria",
        middle_name="Elena",
        last_name="Delgado",
        nickname="Mari",
        date_of_birth=date(1987, 4, 12),
        email="maria.delgado@demo.betterangels.la",
        california_id="D1000001",
        phone="+13235550101",
        gender=GenderEnum.FEMALE,
        race=RaceEnum.HISPANIC_LATINO,
        living_situation=LivingSituationEnum.TENT,
        preferred_language=LanguageEnum.SPANISH,
        marital_status=MaritalStatusEnum.SINGLE,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.SHE_HER_HERS,
        preferred_communication=(PreferredCommunicationEnum.TEXT, PreferredCommunicationEnum.CALL),
        residence_address="Echo Park Ave & W Sunset Blvd, Los Angeles, CA 90026",
        residence_location="echo_park_lake",
        important_notes="Prefers Spanish. Has a service dog named Rocco. Avoid gluten — celiac.",
        hmis_id="DEMO-LA-1001",
        contact=("Rosa Delgado", RelationshipTypeEnum.SIBLING, "+13235550199", "rosa.delgado@example.com"),
        interactions=(
            InteractionSpec(
                purpose="Outreach - Echo Park Lake",
                public_details="Met Maria at her tent site by the lake. Reviewed housing waitlist status and "
                "confirmed she still wants a shelter bed for the coming week.",
                private_details="Site was clean and dry. Declined medical transport; accepted two blankets and "
                "a hygiene kit. Follow up Thursday with the Echo Park team about a bed hold.",
                days_ago=2,
                location="echo_park_lake",
                team="Echo Park Outreach",
            ),
            InteractionSpec(
                purpose="Benefits follow-up - CalFresh",
                public_details="Helped Maria submit her CalFresh renewal online at the library and print the "
                "confirmation page.",
                private_details="Needs a phone number on file for DPSS interviews. Currently using the day-center "
                "number; will get a Lifeline phone at next outreach.",
                days_ago=17,
                location="sunset_junction",
                team="Silver Lake Outreach",
            ),
        ),
    ),
    ClientSpec(
        first_name="Andre",
        middle_name="Terrell",
        last_name="Whitfield",
        date_of_birth=date(1979, 9, 3),
        email="andre.whitfield@demo.betterangels.la",
        california_id="D1000002",
        phone="+13235550102",
        gender=GenderEnum.MALE,
        race=RaceEnum.BLACK_AFRICAN_AMERICAN,
        living_situation=LivingSituationEnum.OPEN_AIR,
        preferred_language=LanguageEnum.ENGLISH,
        marital_status=MaritalStatusEnum.DIVORCED,
        veteran_status=VeteranStatusEnum.YES,
        pronouns=PronounEnum.HE_HIM_HIS,
        preferred_communication=(PreferredCommunicationEnum.CALL,),
        residence_address="5th St & San Pedro St, Los Angeles, CA 90013",
        residence_location="union_rescue_mission",
        important_notes="Navy veteran. Enrolled with VA Greater Los Angeles; keep HUD-VASH referral active.",
        hmis_id="DEMO-LA-1002",
        interactions=(
            InteractionSpec(
                purpose="HUD-VASH referral check-in",
                public_details="Confirmed the VA received the HUD-VASH referral packet and walked Andre through "
                "the voucher briefing appointment.",
                private_details="Voucher briefing 10 days out. Needs a state ID to complete the packet — DMV "
                "no-fee ID form started today.",
                days_ago=4,
                location="union_rescue_mission",
                team="Bowtie & Riverside Outreach",
            ),
            InteractionSpec(
                purpose="Outreach - Skid Row",
                public_details="Distributed water and hygiene kits on San Pedro. Andre asked about storage for "
                "his VA paperwork.",
                private_details="Held his DD-214 and VA letters in the document-storage binder; scan scheduled "
                "for next visit.",
                days_ago=23,
                location="midnight_mission",
                team="LA River Outreach",
            ),
        ),
    ),
    ClientSpec(
        first_name="Sokha",
        last_name="Chan",
        date_of_birth=date(1991, 1, 27),
        email="sokha.chan@demo.betterangels.la",
        california_id="D1000003",
        phone="+13235550103",
        gender=GenderEnum.FEMALE,
        race=RaceEnum.ASIAN,
        living_situation=LivingSituationEnum.SHELTER,
        preferred_language=LanguageEnum.KHMER,
        marital_status=MaritalStatusEnum.MARRIED,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.SHE_HER_HERS,
        preferred_communication=(PreferredCommunicationEnum.CALL, PreferredCommunicationEnum.WHATSAPP),
        residence_address="1100 S Union Ave, Los Angeles, CA 90015",
        residence_location="koreatown_western",
        important_notes="Speaks Khmer; uses her nephew as an interpreter. Reunification case open with DCFS.",
        hmis_id="DEMO-LA-1003",
        contact=("Vann Chan", RelationshipTypeEnum.FRIEND, "+13235550197", "vann.chan@example.com"),
        interactions=(
            InteractionSpec(
                purpose="Family reunification case conference",
                public_details="Joined Sokha's call with her DCFS caseworker and confirmed the next supervised "
                "visit date.",
                private_details="Needs bus tokens for the visit and a copy of her ID in the case file.",
                days_ago=6,
                location="koreatown_western",
                team="WDI On-site",
            ),
            InteractionSpec(
                purpose="Shelter intake follow-up",
                public_details="Completed the shelter intake paperwork and confirmed Sokha's bed assignment at "
                "the Koreatown site.",
                private_details="Bed 12B. Reminded her about the 6pm curfew and the on-site laundry schedule.",
                days_ago=29,
                location="westlake_alvarado",
                team="WDI Outreach",
            ),
        ),
    ),
    ClientSpec(
        first_name="Raymond",
        middle_name="Jose",
        last_name="Ortiz",
        nickname="Ray",
        date_of_birth=date(1968, 6, 15),
        email="raymond.ortiz@demo.betterangels.la",
        california_id="D1000004",
        phone="+13235550104",
        gender=GenderEnum.MALE,
        race=RaceEnum.HISPANIC_LATINO,
        living_situation=LivingSituationEnum.VEHICLE,
        preferred_language=LanguageEnum.SPANISH,
        marital_status=MaritalStatusEnum.WIDOWED,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.HE_HIM_HIS,
        preferred_communication=(PreferredCommunicationEnum.CALL,),
        residence_address="7600 Van Nuys Blvd, Van Nuys, CA 91405",
        residence_location="van_nuys_sepulveda",
        important_notes="Lives in a 1998 pickup with his dog. Diabetic — carries insulin in a cooler.",
        interactions=(
            InteractionSpec(
                purpose="Safe parking intake - Van Nuys",
                public_details="Enrolled Raymond in the Safe Parking program at the Van Nuys lot and reviewed "
                "the overnight rules.",
                private_details="Sticker #A-114. Confirmed he can run his CPAP off the lot's power pedestal.",
                days_ago=8,
                location="van_nuys_sepulveda",
                team="Northeast Hollywood Outreach",
            ),
            InteractionSpec(
                purpose="Diabetes supply delivery",
                public_details="Delivered insulin cold packs, test strips and a sharps container.",
                private_details="Refill due in three weeks. Pharmacy tech confirmed the prescription is active.",
                days_ago=21,
                location="north_hollywood_lankershim",
                team="Northeast Hollywood Outreach",
            ),
        ),
    ),
    ClientSpec(
        first_name="Tanya",
        last_name="Brooks",
        date_of_birth=date(1984, 11, 30),
        email="tanya.brooks@demo.betterangels.la",
        california_id="D1000005",
        phone="+13235550105",
        gender=GenderEnum.FEMALE,
        race=RaceEnum.BLACK_AFRICAN_AMERICAN,
        living_situation=LivingSituationEnum.SHELTER,
        preferred_language=LanguageEnum.ENGLISH,
        marital_status=MaritalStatusEnum.SEPARATED,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.SHE_HER_HERS,
        preferred_communication=(PreferredCommunicationEnum.TEXT,),
        residence_address="3650 W Martin Luther King Jr Blvd, Los Angeles, CA 90008",
        residence_location="crenshaw_mlk",
        important_notes="Two children in kinship care. Working with the Crenshaw legal clinic on custody.",
        hmis_id="DEMO-LA-1005",
        contact=("Aisha Brooks", RelationshipTypeEnum.MOTHER, "+13235550196", "aisha.brooks@example.com"),
        interactions=(
            InteractionSpec(
                purpose="Legal clinic appointment",
                public_details="Escorted Tanya to the Crenshaw legal clinic for her custody consultation.",
                private_details="Attorney requested the shelter verification letter; emailed it the same day.",
                days_ago=5,
                location="crenshaw_mlk",
                team="SELAH Staff",
            ),
            InteractionSpec(
                purpose="Wellness check - MLK Blvd",
                public_details="Routine wellness check; Tanya reported feeling safe at the shelter and asked "
                "about childcare vouchers.",
                private_details="Referred to the on-site childcare navigator and added her to the Thursday "
                "support group.",
                days_ago=26,
                location="vermont_square",
                team="SELAH Staff",
            ),
        ),
    ),
    ClientSpec(
        first_name="Dmitri",
        middle_name="Alexei",
        last_name="Volkov",
        date_of_birth=date(1975, 3, 8),
        email="dmitri.volkov@demo.betterangels.la",
        california_id="D1000006",
        phone="+13235550106",
        gender=GenderEnum.MALE,
        race=RaceEnum.WHITE_CAUCASIAN,
        living_situation=LivingSituationEnum.TENT,
        preferred_language=LanguageEnum.RUSSIAN,
        marital_status=MaritalStatusEnum.SINGLE,
        veteran_status=VeteranStatusEnum.OTHER_THAN_HONORABLE,
        pronouns=PronounEnum.HE_HIM_HIS,
        preferred_communication=(PreferredCommunicationEnum.CALL,),
        residence_address="1600 N Vine St, Los Angeles, CA 90028",
        residence_location="hollywood_vine",
        important_notes="Russian speaker. Interested in the Hollywood interim housing site.",
        interactions=(
            InteractionSpec(
                purpose="Interim housing site tour",
                public_details="Toured the Hollywood interim housing site with Dmitri and answered his questions "
                "about shared rooms.",
                private_details="Wants a lower bunk for his back. Added to the interest list; bed availability "
                "expected within two weeks.",
                days_ago=11,
                location="hollywood_vine",
                team="Hollywood Outreach",
            ),
            InteractionSpec(
                purpose="Outreach - Hollywood Blvd",
                public_details="Evening outreach along Hollywood Blvd; delivered a sleeping bag and a hot meal.",
                private_details="Declined shelter tonight. Reported his tent was swept last week; replacement "
                "provided.",
                days_ago=34,
                location="hollywood_blvd",
                team="Hollywood Outreach",
            ),
        ),
    ),
    ClientSpec(
        first_name="Araceli",
        last_name="Nunez",
        nickname="Ara",
        date_of_birth=date(1996, 8, 19),
        email="araceli.nunez@demo.betterangels.la",
        california_id="D1000007",
        phone="+13235550107",
        gender=GenderEnum.FEMALE,
        race=RaceEnum.HISPANIC_LATINO,
        living_situation=LivingSituationEnum.HOUSING,
        preferred_language=LanguageEnum.SPANISH,
        marital_status=MaritalStatusEnum.SINGLE,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.THEY_THEM_THEIRS,
        preferred_communication=(PreferredCommunicationEnum.TEXT, PreferredCommunicationEnum.EMAIL),
        residence_address="1831 1st St, Los Angeles, CA 90033",
        residence_location="mariachi_plaza",
        important_notes="Recently housed in Boyle Heights. Keeping follow-up support for 90 days.",
        contact=("Mateo Nunez", RelationshipTypeEnum.FATHER, "+13235550195", "mateo.nunez@example.com"),
        interactions=(
            InteractionSpec(
                purpose="90-day housing stability check",
                public_details="Home visit at Araceli's new apartment in Boyle Heights. Rent is current and "
                "utilities are in her name.",
                private_details="Still needs a bed frame and a small dining table; referred to the furniture bank.",
                days_ago=9,
                location="mariachi_plaza",
                team="Bowtie & Riverside Outreach",
            ),
            InteractionSpec(
                purpose="Move-in support - Boyle Heights",
                public_details="Delivered the move-in kit and helped Araceli set up her kitchen.",
                private_details="Apartment in good condition. Landlord confirmed the lease start date.",
                days_ago=47,
                location="boyle_heights_cesar_chavez",
                team="Bowtie & Riverside Outreach",
            ),
        ),
    ),
    ClientSpec(
        first_name="Jerome",
        last_name="Patterson",
        date_of_birth=date(1970, 12, 2),
        email="jerome.patterson@demo.betterangels.la",
        california_id="D1000008",
        phone="+13235550108",
        gender=GenderEnum.MALE,
        race=RaceEnum.BLACK_AFRICAN_AMERICAN,
        living_situation=LivingSituationEnum.OPEN_AIR,
        preferred_language=LanguageEnum.ENGLISH,
        marital_status=MaritalStatusEnum.SINGLE,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.HE_HIM_HIS,
        preferred_communication=(PreferredCommunicationEnum.CALL,),
        residence_address="10300 Compton Ave, Los Angeles, CA 90002",
        residence_location="watts_103rd",
        important_notes="Long-time Watts resident. Interested in the tiny-home village opening.",
        hmis_id="DEMO-LA-1008",
        interactions=(
            InteractionSpec(
                purpose="Tiny home village interest screening",
                public_details="Screened Jerome for the tiny-home village and reviewed the program agreement.",
                private_details="Eligible pending a background check. Documents uploaded to the case file.",
                days_ago=13,
                location="watts_103rd",
                team="SELAH Staff",
            ),
            InteractionSpec(
                purpose="Outreach - Watts",
                public_details="Weekly outreach in Watts; provided water, snacks and socks.",
                private_details="Reported a recent assault; offered a warm hand-off to the on-site crisis "
                "counselor. Declined today, open to next week.",
                days_ago=30,
                location="inglewood_market",
                team="SELAH Staff",
                is_submitted=False,
            ),
        ),
    ),
    ClientSpec(
        first_name="Linh",
        middle_name="Thi",
        last_name="Nguyen",
        date_of_birth=date(1993, 5, 24),
        email="linh.nguyen@demo.betterangels.la",
        california_id="D1000009",
        phone="+13235550109",
        gender=GenderEnum.FEMALE,
        race=RaceEnum.ASIAN,
        living_situation=LivingSituationEnum.SHELTER,
        preferred_language=LanguageEnum.VIETNAMESE,
        marital_status=MaritalStatusEnum.SINGLE,
        veteran_status=VeteranStatusEnum.PREFER_NOT_TO_SAY,
        pronouns=PronounEnum.SHE_HER_HERS,
        preferred_communication=(PreferredCommunicationEnum.CALL,),
        residence_address="900 N Broadway, Los Angeles, CA 90012",
        residence_location="chinatown_broadway",
        important_notes="Vietnamese speaker. Enrolled in the Chinatown on-site ESL class.",
        hmis_id="DEMO-LA-1009",
        interactions=(
            InteractionSpec(
                purpose="Shelter intake - Chinatown",
                public_details="Completed intake at the Chinatown on-site shelter and issued a bed assignment.",
                private_details="Bed 7A. Needs a lock for the storage locker; maintenance ticket opened.",
                days_ago=3,
                location="chinatown_broadway",
                team="Sunday Social / Atwater On-site",
            ),
            InteractionSpec(
                purpose="Document readiness appointment",
                public_details="Helped Linh request a replacement Social Security card and start her California "
                "ID application.",
                private_details="SSA appointment confirmed; needs proof of address from the shelter.",
                days_ago=19,
                location="lincoln_heights",
                team="Sunday Social / Atwater On-site",
            ),
        ),
    ),
    ClientSpec(
        first_name="Gabriel",
        last_name="Ramos",
        date_of_birth=date(1988, 2, 14),
        email="gabriel.ramos@demo.betterangels.la",
        california_id="D1000010",
        phone="+13235550110",
        gender=GenderEnum.MALE,
        race=RaceEnum.HISPANIC_LATINO,
        living_situation=LivingSituationEnum.VEHICLE,
        preferred_language=LanguageEnum.SPANISH,
        marital_status=MaritalStatusEnum.MARRIED,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.HE_HIM_HIS,
        preferred_communication=(PreferredCommunicationEnum.WHATSAPP,),
        residence_address="1000 San Fernando Rd, San Fernando, CA 91340",
        residence_location="pacoima_san_fernando_rd",
        important_notes="Sleeps in an RV with his wife. Needs a smog check to keep the vehicle registered.",
        contact=("Lucia Ramos", RelationshipTypeEnum.OTHER, "+13235550194", "lucia.ramos@example.com"),
        interactions=(
            InteractionSpec(
                purpose="RV safe parking eligibility review",
                public_details="Reviewed Gabriel's RV registration and confirmed eligibility for the safe parking lot.",
                private_details="Registration expires in 45 days. Referred to the smog assistance program.",
                days_ago=7,
                location="pacoima_san_fernando_rd",
                team="Northeast Hollywood Outreach",
            ),
            InteractionSpec(
                purpose="Outreach - San Fernando Rd",
                public_details="Delivered a propane voucher and blankets during the cold-weather alert.",
                private_details="Cold-weather protocol activated. Both occupants accounted for and safe.",
                days_ago=36,
                location="canoga_park_sherman_way",
                team="Northeast Hollywood Outreach",
            ),
        ),
    ),
    ClientSpec(
        first_name="Denise",
        last_name="Coleman",
        date_of_birth=date(1963, 7, 7),
        email="denise.coleman@demo.betterangels.la",
        california_id="D1000011",
        phone="+13235550111",
        gender=GenderEnum.FEMALE,
        race=RaceEnum.BLACK_AFRICAN_AMERICAN,
        living_situation=LivingSituationEnum.SHELTER,
        preferred_language=LanguageEnum.ENGLISH,
        marital_status=MaritalStatusEnum.DIVORCED,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.SHE_HER_HERS,
        preferred_communication=(PreferredCommunicationEnum.CALL,),
        residence_address="200 Pine Ave, Long Beach, CA 90802",
        residence_location="long_beach_pine",
        important_notes="Recuperative care graduate. Mobility limitations — needs a ground-floor bed.",
        hmis_id="DEMO-LA-1011",
        interactions=(
            InteractionSpec(
                purpose="Recuperative care discharge planning",
                public_details="Met with the recuperative care team to plan Denise's discharge to interim housing.",
                private_details="Ground-floor bed requested at the Long Beach site. Transport booked.",
                days_ago=1,
                location="long_beach_pine",
                team="SELAH Staff",
            ),
            InteractionSpec(
                purpose="Medical respite follow-up",
                public_details="Post-discharge check-in; Denise is healing well and keeping her wound-care "
                "appointments.",
                private_details="Wound-care supplies due to run out Friday; pharmacy refill coordinated.",
                days_ago=15,
                location="san_pedro_harbor",
                team="SELAH Staff",
            ),
        ),
    ),
    ClientSpec(
        first_name="Elena",
        last_name="Petrosyan",
        date_of_birth=date(1999, 10, 11),
        email="elena.petrosyan@demo.betterangels.la",
        california_id="D1000012",
        phone="+13235550112",
        gender=GenderEnum.FEMALE,
        race=RaceEnum.WHITE_CAUCASIAN,
        living_situation=LivingSituationEnum.TENT,
        preferred_language=LanguageEnum.ARMENIAN,
        marital_status=MaritalStatusEnum.SINGLE,
        veteran_status=VeteranStatusEnum.NO,
        pronouns=PronounEnum.SHE_HER_HERS,
        preferred_communication=(PreferredCommunicationEnum.INSTAGRAM, PreferredCommunicationEnum.TEXT),
        residence_address="3130 Glendale Blvd, Los Angeles, CA 90039",
        residence_location="atwater_glendale_blvd",
        important_notes="Armenian speaker. Attends the Atwater drop-in on Sundays.",
        interactions=(
            InteractionSpec(
                purpose="Sunday drop-in support",
                public_details="Connected Elena with the Sunday Social drop-in for a shower and a hot meal.",
                private_details="Asked about a caseworker for her ID replacement; assigned to the Atwater team.",
                days_ago=10,
                location="atwater_glendale_blvd",
                team="Sunday Social / Atwater Outreach",
            ),
            InteractionSpec(
                purpose="Outreach - Glendale Blvd",
                public_details="Follow-up outreach near Glendale Blvd; confirmed Elena's tent is still standing.",
                private_details="Tent has a tear; replacement tarp provided. Encouraged her to consider the "
                "winter shelter.",
                days_ago=44,
                location="glendale_brand",
                team="Sunday Social / Atwater Outreach",
                is_submitted=False,
            ),
        ),
    ),
    ClientSpec(
        first_name="William",
        middle_name="Henry",
        last_name="Hargrove",
        nickname="Bill",
        date_of_birth=date(1957, 1, 9),
        email="william.hargrove@demo.betterangels.la",
        california_id="D1000013",
        phone="+13235550113",
        gender=GenderEnum.MALE,
        race=RaceEnum.WHITE_CAUCASIAN,
        living_situation=LivingSituationEnum.HOUSING,
        preferred_language=LanguageEnum.ENGLISH,
        marital_status=MaritalStatusEnum.WIDOWED,
        veteran_status=VeteranStatusEnum.YES,
        pronouns=PronounEnum.HE_HIM_HIS,
        preferred_communication=(PreferredCommunicationEnum.CALL, PreferredCommunicationEnum.EMAIL),
        residence_address="10861 Weyburn Ave, Los Angeles, CA 90024",
        residence_location="westwood_weyburn",
        important_notes="Vietnam-era veteran, housed via HUD-VASH. Monthly check-ins.",
        hmis_id="DEMO-LA-1013",
        interactions=(
            InteractionSpec(
                purpose="Monthly housing check-in",
                public_details="Monthly check-in with Bill at his Westwood apartment; rent and utilities are current.",
                private_details="Reports some loneliness. Invited him to the veteran peer group at the VA.",
                days_ago=12,
                location="westwood_weyburn",
                team="WDI On-site",
            ),
        ),
    ),
)


class Command(BaseCommand):
    help = "Idempotently seed demo clients, interactions (notes) and LA map locations."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--author-email",
            default="admin@example.com",
            help="Email of the user credited as note author/owner (default: admin@example.com).",
        )
        parser.add_argument(
            "--organization-id",
            type=int,
            default=None,
            help="Organization to own the notes. Defaults to the author's Caseworker org (the app's own scoping).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be created without writing anything.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help=(
                "Write even when settings.IS_LOCAL_DEV is false. Without this the "
                "command refuses to seed demo data into a non-local database."
            ),
        )

    def handle(self, *args: Any, **options: Any) -> None:
        dry_run: bool = bool(options["dry_run"])
        force: bool = bool(options["force"])

        # This command writes demo clients, interactions and map locations into
        # whatever database the process points at, so it has to fail closed rather
        # than rely on the default --author-email happening not to exist.
        # IS_LOCAL_DEV is the same gate the reference-data seeder uses.
        # --dry-run is always allowed because it writes nothing.
        if not settings.IS_LOCAL_DEV and not force and not dry_run:
            raise CommandError(
                "seed_demo_clients writes demo data and refused to run because "
                "settings.IS_LOCAL_DEV is false. Re-run with --dry-run to inspect, "
                "or --force if this database is genuinely a throwaway."
            )

        if not settings.IS_LOCAL_DEV and force:
            self.stdout.write(self.style.WARNING("IS_LOCAL_DEV is false — proceeding because --force was passed."))

        author = self._resolve_author(options["author_email"])
        organization = self._resolve_organization(options["organization_id"], author)
        permission_group = get_permission_group_for_org(author, organization, template=CASEWORKER)

        self.stdout.write(
            f"Author: {author.email} (id={author.pk}) · org: {organization.name} (id={organization.pk}) · "
            f"permission group: {permission_group.name}"
        )
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no rows will be written."))

        content_type = ContentType.objects.get_for_model(ClientProfile)
        clients_created = clients_existing = 0
        notes_created = notes_existing = 0

        for spec in DEMO_CLIENTS:
            client, created = self._seed_client(spec, content_type, dry_run=dry_run)
            if created:
                clients_created += 1
            else:
                clients_existing += 1

            created_here, existing_here = self._seed_interactions(
                client=client,
                spec=spec,
                author=author,
                permission_group=permission_group,
                organization=organization,
                dry_run=dry_run,
            )
            notes_created += created_here
            notes_existing += existing_here

        total_notes = Note.objects.count()
        total_clients = ClientProfile.objects.count()
        total_locations = Location.objects.count()
        pointed_locations = Location.objects.exclude(point__isnull=True).count()

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Clients: {clients_created} created, {clients_existing} already present (db total {total_clients})."
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Interactions (notes): {notes_created} created, {notes_existing} already present "
                f"(db total {total_notes})."
            )
        )
        self.stdout.write(
            self.style.SUCCESS(f"common_location: {total_locations} rows, {pointed_locations} with a non-null point.")
        )

    # ------------------------------------------------------------------
    # Resolution helpers
    # ------------------------------------------------------------------

    def _resolve_author(self, email: str) -> User:
        author = User.objects.filter(email__iexact=email).first()
        if author is None:
            raise CommandError(f"No user with email '{email}'.")
        return author

    def _resolve_organization(self, organization_id: Optional[int], author: User) -> Organization:
        if organization_id is not None:
            organization = Organization.objects.filter(pk=organization_id).first()
            if organization is None:
                raise CommandError(f"No organization with id {organization_id}.")
            return organization

        # Same resolution the app uses when creating a note: the org where the
        # author holds the Caseworker permission group.
        #
        # Ordered, because an author can hold Caseworker in more than one org and
        # the note ownership (and therefore which org's data this seeds) would
        # otherwise change from run to run. Pass --organization-id to be explicit.
        permission_group = (
            PermissionGroup.objects.select_related("organization")
            .filter(template__name=CASEWORKER.name, user=author.pk)
            .order_by("pk")
            .first()
        )
        if permission_group is None:
            raise CommandError(
                f"User {author.email} does not hold a '{CASEWORKER.name}' permission group in any organization; "
                "pass --organization-id explicitly."
            )
        return permission_group.organization

    def _point_for(self, location_key: str) -> Point:
        location = LA_LOCATIONS[location_key]
        return Point(float(location["longitude"]), float(location["latitude"]), srid=4326)

    def _location_data(self, location_key: str) -> dict[str, Any]:
        location = LA_LOCATIONS[location_key]
        return {
            "point": self._point_for(location_key),
            "point_of_interest": location["label"],
            "address": {"formatted_address": location["address"]},
        }

    def _resolve_team(self, organization: Organization, team_name: str) -> Optional[Team]:
        return Team.objects.filter(organization=organization, name=team_name).first()

    # ------------------------------------------------------------------
    # Seeding helpers
    # ------------------------------------------------------------------

    def _seed_client(
        self,
        spec: ClientSpec,
        content_type: ContentType,
        *,
        dry_run: bool,
    ) -> tuple[Optional[ClientProfile], bool]:
        """Return (client, created). Existing rows are left untouched.

        ``client`` is ``None`` only for a dry run of a client that does not
        exist yet — there is no row to hang interactions off.
        """
        # `including_merged()` matters: `email` is unique across all rows, but the
        # default manager hides merged profiles, so a merged demo client would
        # otherwise look absent and the create below would raise IntegrityError
        # instead of no-op'ing.
        client = ClientProfile.objects.including_merged().filter(email=spec.email).first()
        created = client is None

        if dry_run:
            return client, created

        # One transaction per client: a failure part-way through must not leave a
        # bare client row behind.
        #
        # Branches on `client is None` rather than the `created` flag so the type
        # checker can narrow it for the related rows below.
        with transaction.atomic():
            if client is None:
                client = ClientProfile.objects.create(
                    first_name=spec.first_name,
                    middle_name=spec.middle_name,
                    last_name=spec.last_name,
                    nickname=spec.nickname,
                    date_of_birth=spec.date_of_birth,
                    email=spec.email,
                    california_id=spec.california_id,
                    phone_number=spec.phone,
                    gender=spec.gender,
                    race=spec.race,
                    living_situation=spec.living_situation,
                    preferred_language=spec.preferred_language,
                    preferred_communication=list(spec.preferred_communication) or None,
                    marital_status=spec.marital_status,
                    veteran_status=spec.veteran_status,
                    pronouns=spec.pronouns,
                    important_notes=spec.important_notes,
                    residence_address=spec.residence_address,
                    residence_geolocation=self._point_for(spec.residence_location),
                )

            # These are ensured OUTSIDE the `created` branch on purpose. Returning
            # early for an existing client used to skip them, so a run that died
            # before creating them could never be repaired by a later run.
            # Keyed on the client (not the number) so a pre-existing row is left
            # alone rather than gaining a duplicate.
            PhoneNumber.objects.get_or_create(
                content_type=content_type,
                object_id=client.pk,
                defaults={"number": spec.phone, "is_primary": True},
            )

            if spec.hmis_id:
                HmisProfile.objects.get_or_create(
                    client_profile=client,
                    hmis_id=spec.hmis_id,
                    agency=HmisAgencyEnum.LAHSA,
                )

            if spec.contact:
                name, relationship, phone, email = spec.contact
                ClientContact.objects.get_or_create(
                    client_profile=client,
                    name=name,
                    defaults={
                        "relationship_to_client": relationship,
                        "phone_number": phone,
                        "email": email,
                    },
                )

        return client, created

    def _seed_interactions(
        self,
        *,
        client: Optional[ClientProfile],
        spec: ClientSpec,
        author: User,
        permission_group: PermissionGroup,
        organization: Organization,
        dry_run: bool,
    ) -> tuple[int, int]:
        created = existing = 0

        for interaction in spec.interactions:
            if client is not None:
                already_there = Note.objects.filter(
                    client_profile=client,
                    purpose=interaction.purpose,
                    public_details=interaction.public_details,
                ).exists()
                if already_there:
                    existing += 1
                    continue

            created += 1
            if dry_run or client is None:
                continue

            team = self._resolve_team(organization, interaction.team)
            interacted_at = timezone.now() - timedelta(days=interaction.days_ago, hours=interaction.days_ago % 7)

            # The app's own note-creation path: sets organization from the
            # acting permission group and assigns object-level permissions.
            note_create(
                user=author,
                permission_group=permission_group,
                purpose=interaction.purpose,
                team_id=str(team.pk) if team else None,
                public_details=interaction.public_details,
                private_details=interaction.private_details,
                client_profile_id=str(client.pk),
                is_submitted=interaction.is_submitted,
                interacted_at=interacted_at,
                location_data=self._location_data(interaction.location),
            )

        return created, existing
