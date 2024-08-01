from django.db import models
from django.utils.translation import gettext_lazy as _


# Advanced Info
class ShelterChoices(models.TextChoices):
    A_BRIDGE_HOME = "a_bridge_home", _("A Bridge Home")
    CRISIS_HOUSING = "crisis_housing", _("Crisis Housing")
    EMERGENCY_SHELTER = "emergency_shelter", _("Emergency Shelter")
    FAITH_BASED = "faith_based", _("Faith Based")
    INTERIM_HOUSING = "interim_housing", _("Interim Housing")
    PERMANENT_HOUSING = "permanent_housing", _("Permanent Housing")
    PROJECT_HOMEKEY = "project_homekey", _("Project Home Key (PHK)")
    RAPID_REHOUSING = "rapid_rehousing", _("Rapid Rehousing")
    RECUPERATIVE_CARE = "recuperative_care", _("Recuperative Care")
    ROADMAP_HOME = "roadmap_home", _("Roadmap Home")
    SAFE_PARK_LA = "safe_park_la", _("Safe Park LA")
    SOBER_LIVING = "sober_living", _("Sober Living")
    TINY_HOME_VILLAGE = "tiny_home_village", _("Tiny Home Village")
    TRANSITIONAL_HOUSING = "transitional_housing", _("Transitional Housing")
    WINTER_SHELTER = "winter_shelter", _("Winter Shelter")


class PopulationChoices(models.TextChoices):
    ADULTS = "adults", _("Adults")
    BOYS = "boys", _("Boys")
    CHILDREN = "children", _("Children")
    DOMESTIC_VIOLENCE = "domestic_violence", _("Domestic Violence (DV/IPV)")
    ENHANCED_BRIDGE_HOUSING_FOR_OLDER_ADULTS = "enhanced_bridge_housing_older_adults", _(
        "Enhanced Bridge Housing for Older Adults"
    )
    ENHANCED_BRIDGE_HOUSING_FOR_WOMEN = "enhanced_bridge_housing_women", _("Enhanced Bridge Housing for Women")
    FAMILIES = "families", _("Families")
    GIRLS = "girls", _("Girls")
    HIV_AND_AIDS = "hiv_and_aids", _("HIV/AIDS")
    HUMAN_TRAFFICKING = "human_trafficking", _("Human Trafficking")
    JUSTICE_SYSTEM_EXITING = "justice_system_exiting", _(
        "B7 Bridge Housing for Persons Exiting Justice System Institutions"
    )
    LGBTQ = "lgbtq", _("LGBTQ")
    MEN = "men", _("Men")
    SENIORS = "seniors", _("Seniors (55+)")
    VETERANS = "veterans", _("Veterans")
    WOMEN = "women", _("Women")
    YOUTH = "youth", _("Youth (TAY)")


class ImmediateNeedChoices(models.TextChoices):
    CLOTHING = "clothing", _("Clothing")
    FOOD = "food", _("Food")
    SHOWERS = "showers", _("Showers")


class GeneralServiceChoices(models.TextChoices):
    CASE_MANAGEMENT = "case_management", _("Case Management")
    CHILDCARE = "childcare", _("Childcare")
    COMPUTERS = "computers", _("Computers")
    FINANCIAL_LITERACY_ASSISTANCE = "financial_literacy_assistance", _("Financial Literacy/Assistance")
    HOUSING_NAVIGATION = "housing_navigation", _("Housing Navigation")
    LEGAL_ASSISTANCE = "legal_assistance", _("Legal Assistance")
    MAIL = "mail", _("Mail")
    PHONE = "phone", _("Phone")
    TRANSPORTATION = "transportation", _("Transportation")


class HealthServiceChoices(models.TextChoices):
    MEDICATION_ADMINISTRATION = "medication_administration", _("Medication Administration")
    MEDICATION_MONITORING = "medication_monitoring", _("Medication Monitoring")
    MENTAL_HEALTH = "mental_health", _("Mental Health")
    SUBSTANCE_USE_TREATMENT = "substance_use_treatment", _("Substance Use Treatment")


class CareerServiceChoices(models.TextChoices):
    JOB_TRAINING = "job_training", _("Job Training")
    LIFE_SKILLS_TRAINING = "life_skills_training", _("Life Skills Training")
    TUTORING = "tutoring", _("Tutoring")


class FunderChoices(models.TextChoices):
    CITY_OF_LOS_ANGELES = "city_of_los_angeles", _("City of Los Angeles")
    DHS = "dhs", _("DHS")
    DMH = "dmh", _("DMH")
    FEDERAL_FUNDING = "federal_funding", _("Federal Funding")
    HOPWA = "hopwa", _("HOPWA")
    LAHSA = "lahsa", _("LAHSA")
    PRIVATE = "private", _("Private")


class AccessibilityChoices(models.TextChoices):
    MEDICAL_EQUIPMENT_PERMITTED = "medical_equipment_permitted", _("Medical Equipment Permitted")
    WHEELCHAIR_ACCESSIBLE = "wheelchair_accessible", _("Wheelchair Accessible")


class StorageChoices(models.TextChoices):
    AMNESTY_LOCKERS = "amnesty_lockers", _("Amnesty Lockers")
    LOCKERS = "lockers", _("Lockers")
    STORAGE = "storage", _("Storage")


class ParkingChoices(models.TextChoices):
    AUTO_OR_SMALL_TRUCK = "auto_or_small_truck", _("Auto or Small Truck")
    BICYCLE = "bicycle", _("Bicycle")
    MOTORCYCLE = "motorcycle", _("Motorcycle")
    RV = "rv", _("RV")


# Restrictions
class EntryRequirementChoices(models.TextChoices):
    MEDICAID_OR_MEDICARE = "medicaid_or_medicare", _("Medicaid or Medicare")
    PHOTO_ID = "photo_id", _("Photo ID")
    REFERRAL = "referral", _("Referral")
    RESERVATION = "reservation", _("Reservation")


class CityChoices(models.TextChoices):
    AGOURA_HILLS = "agoura_hills", _("Agoura Hills")
    ALHAMBRA = "alhambra", _("Alhambra")
    ARCADIA = "arcadia", _("Arcadia")
    ARTESIA = "artesia", _("Artesia")
    AVALON = "avalon", _("Avalon")
    AZUSA = "azusa", _("Azusa")
    BALDWIN_PARK = "baldwin_park", _("Baldwin Park")
    BELL = "bell", _("Bell")
    BELLFLOWER = "bellflower", _("Bellflower")
    BELL_GARDENS = "bell_gardens", _("Bell Gardens")
    BEVERLY_HILLS = "beverly_hills", _("Beverly Hills")
    BRADBURY = "bradbury", _("Bradbury")
    BURBANK = "burbank", _("Burbank")
    CALABASAS = "calabasas", _("Calabasas")
    CARSON = "carson", _("Carson")
    CERRITOS = "cerritos", _("Cerritos")
    CLAREMONT = "claremont", _("Claremont")
    COMMERCE = "commerce", _("Commerce")
    COMPTON = "compton", _("Compton")
    COVINA = "covina", _("Covina")
    CUDAHY = "cudahy", _("Cudahy")
    CULVER_CITY = "culver_city", _("Culver City")
    DIAMOND_BAR = "diamond_bar", _("Diamond Bar")
    DOWNEY = "downey", _("Downey")
    DUARTE = "duarte", _("Duarte")
    EL_MONTE = "el_monte", _("El Monte")
    EL_SEGUNDO = "el_segundo", _("El Segundo")
    GARDENA = "gardena", _("Gardena")
    GLENDALE = "glendale", _("Glendale")
    GLENDORA = "glendora", _("Glendora")
    HAWAIIAN_GARDENS = "hawaiian_gardens", _("Hawaiian Gardens")
    HAWTHORNE = "hawthorne", _("Hawthorne")
    HERMOSA_BEACH = "hermosa_beach", _("Hermosa Beach")
    HIDDEN_HILLS = "hidden_hills", _("Hidden Hills")
    HOLLYWOOD = "hollywood", _("Hollywood")
    HUNTINGTON_PARK = "huntington_park", _("Huntington Park")
    INDUSTRY = "industry", _("Industry")
    INGLEWOOD = "inglewood", _("Inglewood")
    IRWINDALE = "irwindale", _("Irwindale")
    LA_CANADA_FLINTRIDGE = "la_canada_flintridge", _("La Canada Flintridge")
    LA_HABRA_HEIGHTS = "la_habra_heights", _("La Habra Heights")
    LA_MIRADA = "la_mirada", _("La Mirada")
    LA_PUENTE = "la_puente", _("La Puente")
    LA_VERNE = "la_verne", _("La Verne")
    LAKEWOOD = "lakewood", _("Lakewood")
    LANCASTER = "lancaster", _("Lancaster")
    LAWNDALE = "lawndale", _("Lawndale")
    LOMITA = "lomita", _("Lomita")
    LONG_BEACH = "long_beach", _("Long Beach")
    LOS_ANGELES = "los_angeles", _("Los Angeles")
    LYNWOOD = "lynwood", _("Lynwood")
    MALIBU = "malibu", _("Malibu")
    MANHATTAN_BEACH = "manhattan_beach", _("Manhattan Beach")
    MAYWOOD = "maywood", _("Maywood")
    MONROVIA = "monrovia", _("Monrovia")
    MONTEBELLO = "montebello", _("Montebello")
    MONTEREY_PARK = "monterey_park", _("Monterey Park")
    NORWALK = "norwalk", _("Norwalk")
    PALMDALE = "palmdale", _("Palmdale")
    PALOS_VERDES_ESTATES = "palos_verdes_estates", _("Palos Verdes Estates")
    PARAMOUNT = "paramount", _("Paramount")
    PASADENA = "pasadena", _("Pasadena")
    PICO_RIVERA = "pico_rivera", _("Pico Rivera")
    POMONA = "pomona", _("Pomona")
    RANCHO_PALOS_VERDES = "rancho_palos_verdes", _("Rancho Palos Verdes")
    REDONDO_BEACH = "redondo_beach", _("Redondo Beach")
    ROLLING_HILLS = "rolling_hills", _("Rolling Hills")
    ROLLING_HILLS_ESTATES = "rolling_hills_estates", _("Rolling Hills Estates")
    ROSEMEAD = "rosemead", _("Rosemead")
    SAN_DIMAS = "san_dimas", _("San Dimas")
    SAN_FERNANDO = "san_fernando", _("San Fernando")
    SAN_GABRIEL = "san_gabriel", _("San Gabriel")
    SAN_MARINO = "san_marino", _("San Marino")
    SANTA_CLARITA = "santa_clarita", _("Santa Clarita")
    SANTA_FE_SPRINGS = "santa_fe_springs", _("Santa Fe Springs")
    SANTA_MONICA = "santa_monica", _("Santa Monica")
    SIERRA_MADRE = "sierra_madre", _("Sierra Madre")
    SIGNAL_HILL = "signal_hill", _("Signal Hill")
    SOUTH_EL_MONTE = "south_el_monte", _("South El Monte")
    SOUTH_GATE = "south_gate", _("South Gate")
    SOUTH_PASADENA = "south_pasadena", _("South Pasadena")
    TEMPLE_CITY = "temple_city", _("Temple City")
    TORRANCE = "torrance", _("Torrance")
    VERNON = "vernon", _("Vernon")
    VENICE = "venice", _("Venice")
    WALNUT = "walnut", _("Walnut")
    WEST_COVINA = "west_covina", _("West Covina")
    WEST_HOLLYWOOD = "west_hollywood", _("West Hollywood")
    WESTLAKE_VILLAGE = "westlake_village", _("Westlake Village")
    WEST_LOS_ANGELES = "west_los_angeles", _("West Los Angeles")
    WHITTIER = "whittier", _("Whittier")


class SPAChoices(models.IntegerChoices):
    ONE = 1, _("1 - Antelope Valley")
    TWO = 2, _("2 - San Fernando")
    THREE = 3, _("3 - San Gabriel")
    FOUR = 4, _("4 - Metro")
    FIVE = 5, _("5 - West")
    SIX = 6, _("6 - South")
    SEVEN = 7, _("7 - East")
    EIGHT = 8, _("8 - South Bay/Harbor")


class PetChoices(models.TextChoices):
    CATS = "cats", _("Cats")
    DOGS_OVER_25_LBS = "dogs_over_25lbs", _("Dogs >25lbs")
    DOGS_UNDER_25_LBS = "dogs_under_25lbs", _("Dogs <25lbs")
    EMOTIONAL_SUPPORT = "emotional_support", _("Emotional Support")
    EXOTICS = "exotics", _("Exotics")
    SERVICE_ANIMAL = "service_animal", _("Service Animal")


# Bed Information
class SleepingChoices(models.TextChoices):
    BUNK_BEDS = "bunk_beds", _("Bunk beds")
    DORMITORY = "dormitory", _("Dormitory")
    LOW_BARRIER = "low_barrier", _("Low Barrier")
    MOTEL = "motel", _("Motel")
    SHARED_ROOMS = "shared_rooms", _("Shared Rooms")
    SINGLE_ROOM = "single_room", _("Single Room")
