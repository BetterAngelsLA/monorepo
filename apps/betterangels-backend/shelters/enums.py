from django.db import models
from django.utils.translation import gettext_lazy as _


# Advanced Info
class ShelterChoices(models.TextChoices):
    A_BRIDGE_HOME = "A Bridge Home", _("A Bridge Home")
    CRISIS_HOUSING = "Crisis Housing", _("Crisis Housing")
    EMERGENCY_SHELTER = "Emergency Shelter", _("Emergency Shelter")
    FAITH_BASED = "Faith Based", _("Faith Based")
    INTERIM_HOUSING = "Interim Housing", _("Interim Housing")
    PERMANENT_HOUSING = "Permanent Housing", _("Permanent Housing")
    PROJECT_HOMEKEY = "Project Home Key (PHK)", _("Project Home Key (PHK)")
    RAPID_REHOUSING = "Rapid Rehousing", _("Rapid Rehousing")
    RECUPERATIVE_CARE = "Recuperative Care", _("Recuperative Care")
    ROADMAP_HOME = "Roadmap Home", _("Roadmap Home")
    SAFE_PARK_LA = "Safe Park LA", _("Safe Park LA")
    SOBER_LIVING = "Sober Living", _("Sober Living")
    TINY_HOME_VILLAGE = "Tiny Home Village", _("Tiny Home Village")
    TRANSITIONAL_HOUSING = "Transitional Housing", _("Transitional Housing")
    WINTER_SHELTER = "Winter Shelter", _("Winter Shelter")


class PopulationChoices(models.TextChoices):
    ADULTS = "Adults", _("Adults")
    BOYS = "Boys", _("Boys")
    DOMESTIC_VIOLENCE = "Domestic Violence (DV/IPV)", _("Domestic Violence (DV/IPV)")
    FAMILIES = "Families", _("Families")
    GIRLS = "Girls", _("Girls")
    HIV_AND_AIDS = "HIV/AIDS", _("HIV/AIDS")
    HUMAN_TRAFFICKING = "Human Trafficking", _("Human Trafficking")
    LGBTQ = "LGBTQ", _("LGBTQ")
    MEN = "Men", _("Men")
    SENIORS = "Seniors (55+)", _("Seniors (55+)")
    VETERANS = "Veterans", _("Veterans")
    WOMEN = "Women", _("Women")
    YOUTH = "Youth (TAY)", _("Youth (TAY)")


class ImmediateNeedChoices(models.TextChoices):
    CLOTHING = "Clothing", _("Clothing")
    FOOD = "Food", _("Food")
    SHOWERS = "Showers", _("Showers")


class GeneralServiceChoices(models.TextChoices):
    CASE_MANAGEMENT = "Case Management", _("Case Management")
    CHILDCARE = "Childcare", _("Childcare")
    COMPUTERS = "Computers", _("Computers")
    FINANCIAL_LITERACY_ASSISTANCE = "Financial Literacy/Assistance", _("Financial Literacy/Assistance")
    HOUSING_NAVIGATION = "Housing Navigation", _("Housing Navigation")
    LEGAL_ASSISTANCE = "Legal Assistance", _("Legal Assistance")
    MAIL = "Mail", _("Mail")
    PHONE = "Phone", _("Phone")
    TRANSPORTATION = "Transportation", _("Transportation")


class HealthServiceChoices(models.TextChoices):
    MEDICATION_ADMINISTRATION = "Medication Administration", _("Medication Administration")
    MEDICATION_MONITORING = "Medication Monitoring", _("Medication Monitoring")
    MENTAL_HEALTH = "Mental Health", _("Mental Health")
    SUBSTANCE_USE_TREATMENT = "Substance Use Treatment", _("Substance Use Treatment")


class CareerServiceChoices(models.TextChoices):
    JOB_TRAINING = "Job Training", _("Job Training")
    LIFE_SKILLS_TRAINING = "Life Skills Training", _("Life Skills Training")
    TUTORING = "Tutoring", _("Tutoring")


class FunderChoices(models.TextChoices):
    DHS = "DHS", _("DHS")
    DMH = "DMH", _("DMH")
    FEDERAL_FUNDING = "Federal Funding", _("Federal Funding")
    HOPWA = "HOPWA", _("HOPWA")
    LAHSA = "LAHSA", _("LAHSA")
    PRIVATE = "Private", _("Private")


class AccessibilityChoices(models.TextChoices):
    MEDICAL_EQUIPMENT_PERMITTED = "Medical Equipment Permitted", _("Medical Equipment Permitted")
    WHEELCHAIR_ACCESSIBLE = "Wheelchair Accessible", _("Wheelchair Accessible")


class StorageChoices(models.TextChoices):
    AMNESTY_LOCKERS = "Amnesty Lockers", _("Amnesty Lockers")
    LOCKERS = "Lockers", _("Lockers")
    STORAGE = "Storage", _("Storage")


class ParkingChoices(models.TextChoices):
    AUTO_OR_SMALL_TRUCK = "Auto or Small Truck", _("Auto or Small Truck")
    BICYCLE = "Bicycle", _("Bicycle")
    MOTORCYCLE = "Motorcycle", _("Motorcycle")
    RV = "RV", _("RV")


# Restrictions
class EntryRequirementChoices(models.TextChoices):
    MEDICAID_OR_MEDICARE = "Medicaid or Medicare", _("Medicaid or Medicare")
    PHOTO_ID = "Photo ID", _("Photo ID")
    REFERRAL = "Referral", _("Referral")
    RESERVATION = "Reservation", _("Reservation")


class CityChoices(models.TextChoices):
    AGOURA_HILLS = "Agoura Hills", _("Agoura Hills")
    ALHAMBRA = "Alhambra", _("Alhambra")
    ARCADIA = "Arcadia", _("Arcadia")
    ARTESIA = "Artesia", _("Artesia")
    AVALON = "Avalon", _("Avalon")
    AZUSA = "Azusa", _("Azusa")
    BALDWIN_PARK = "Baldwin Park", _("Baldwin Park")
    BELL = "Bell", _("Bell")
    BELLFLOWER = "Bellflower", _("Bellflower")
    BELL_GARDENS = "Bell Gardens", _("Bell Gardens")
    BEVERLY_HILLS = "Beverly Hills", _("Beverly Hills")
    BRADBURY = "Bradbury", _("Bradbury")
    BURBANK = "Burbank", _("Burbank")
    CALABASAS = "Calabasas", _("Calabasas")
    CARSON = "Carson", _("Carson")
    CERRITOS = "Cerritos", _("Cerritos")
    CLAREMONT = "Claremont", _("Claremont")
    COMMERCE = "Commerce", _("Commerce")
    COMPTON = "Compton", _("Compton")
    COVINA = "Covina", _("Covina")
    CUDAHY = "Cudahy", _("Cudahy")
    CULVER_CITY = "Culver City", _("Culver City")
    DIAMOND_BAR = "Diamond Bar", _("Diamond Bar")
    DOWNEY = "Downey", _("Downey")
    DUARTE = "Duarte", _("Duarte")
    EL_MONTE = "El Monte", _("El Monte")
    EL_SEGUNDO = "El Segundo", _("El Segundo")
    GARDENA = "Gardena", _("Gardena")
    GLENDALE = "Glendale", _("Glendale")
    GLENDORA = "Glendora", _("Glendora")
    HAWAIIAN_GARDENS = "Hawaiian Gardens", _("Hawaiian Gardens")
    HAWTHORNE = "Hawthorne", _("Hawthorne")
    HERMOSA_BEACH = "Hermosa Beach", _("Hermosa Beach")
    HIDDEN_HILLS = "Hidden Hills", _("Hidden Hills")
    HOLLYWOOD = "Hollywood", _("Hollywood")
    HUNTINGTON_PARK = "Huntington Park", _("Huntington Park")
    INDUSTRY = "Industry", _("Industry")
    INGLEWOOD = "Inglewood", _("Inglewood")
    IRWINDALE = "Irwindale", _("Irwindale")
    LA_CANADA_FLINTRIDGE = "La Canada Flintridge", _("La Canada Flintridge")
    LA_HABRA_HEIGHTS = "La Habra Heights", _("La Habra Heights")
    LA_MIRADA = "La Mirada", _("La Mirada")
    LA_PUENTE = "La Puente", _("La Puente")
    LA_VERNE = "La Verne", _("La Verne")
    LAKEWOOD = "Lakewood", _("Lakewood")
    LANCASTER = "Lancaster", _("Lancaster")
    LAWNDALE = "Lawndale", _("Lawndale")
    LOMITA = "Lomita", _("Lomita")
    LONG_BEACH = "Long Beach", _("Long Beach")
    LOS_ANGELES = "Los Angeles", _("Los Angeles")
    LYNWOOD = "Lynwood", _("Lynwood")
    MALIBU = "Malibu", _("Malibu")
    MANHATTAN_BEACH = "Manhattan Beach", _("Manhattan Beach")
    MAYWOOD = "Maywood", _("Maywood")
    MONROVIA = "Monrovia", _("Monrovia")
    MONTEBELLO = "Montebello", _("Montebello")
    MONTEREY_PARK = "Monterey Park", _("Monterey Park")
    NORWALK = "Norwalk", _("Norwalk")
    PALMDALE = "Palmdale", _("Palmdale")
    PALOS_VERDES_ESTATES = "Palos Verdes Estates", _("Palos Verdes Estates")
    PARAMOUNT = "Paramount", _("Paramount")
    PASADENA = "Pasadena", _("Pasadena")
    PICO_RIVERA = "Pico Rivera", _("Pico Rivera")
    POMONA = "Pomona", _("Pomona")
    RANCHO_PALOS_VERDES = "Rancho Palos Verdes", _("Rancho Palos Verdes")
    REDONDO_BEACH = "Redondo Beach", _("Redondo Beach")
    ROLLING_HILLS = "Rolling Hills", _("Rolling Hills")
    ROLLING_HILLS_ESTATES = "Rolling Hills Estates", _("Rolling Hills Estates")
    ROSEMEAD = "Rosemead", _("Rosemead")
    SAN_DIMAS = "San Dimas", _("San Dimas")
    SAN_FERNANDO = "San Fernando", _("San Fernando")
    SAN_GABRIEL = "San Gabriel", _("San Gabriel")
    SAN_MARINO = "San Marino", _("San Marino")
    SANTA_CLARITA = "Santa Clarita", _("Santa Clarita")
    SANTA_FE_SPRINGS = "Santa Fe Springs", _("Santa Fe Springs")
    SANTA_MONICA = "Santa Monica", _("Santa Monica")
    SIERRA_MADRE = "Sierra Madre", _("Sierra Madre")
    SIGNAL_HILL = "Signal Hill", _("Signal Hill")
    SOUTH_EL_MONTE = "South El Monte", _("South El Monte")
    SOUTH_GATE = "South Gate", _("South Gate")
    SOUTH_PASADENA = "South Pasadena", _("South Pasadena")
    TEMPLE_CITY = "Temple City", _("Temple City")
    TORRANCE = "Torrance", _("Torrance")
    VERNON = "Vernon", _("Vernon")
    WALNUT = "Walnut", _("Walnut")
    WEST_COVINA = "West Covina", _("West Covina")
    WEST_HOLLYWOOD = "West Hollywood", _("West Hollywood")
    WESTLAKE_VILLAGE = "Westlake Village", _("Westlake Village")
    WEST_LOS_ANGELES = "West Los Angeles", _("West Los Angeles")
    WHITTIER = "Whittier", _("Whittier")


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
    CATS = "Cats", _("Cats")
    DOGS_OVER_25_LBS = "Dogs >25lbs", _("Dogs >25lbs")
    DOGS_UNDER_25_LBS = "Dogs <25lbs", _("Dogs <25lbs")
    EMOTIONAL_SUPPORT = "Emotional Support", _("Emotional Support")
    EXOTICS = "Exotics", _("Exotics")
    SERVICE_ANIMAL = "Service Animal", _("Service Animal")


# Bed Information
class SleepingChoices(models.TextChoices):
    BUNK_BEDS = "Bunk beds", _("Bunk beds")
    DORMITORY = "Dormitory", _("Dormitory")
    LOW_BARRIER = "Low Barrier", _("Low Barrier")
    MOTEL = "Motel", _("Motel")
    SHARED_ROOMS = "Shared Rooms", _("Shared Rooms")
    SINGLE_ROOM = "Single Room", _("Single Room")
