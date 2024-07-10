from django.db import models
from django.utils.translation import gettext_lazy as _


# Advanced Info
class ShelterChoices(models.TextChoices):
    FAITH_BASED = "Faith Based", _("Faith Based")
    INTERIM_HOUSING = "Interim Housing", _("Interim Housing")
    PERMANENT_HOUSING = "Permanent Housing", _("Permanent Housing")
    A_BRIDGE_HOME = "A Bridge Home", _("A Bridge Home")
    PROJECT_HOMEKEY = "Project Home Key (PHK)", _("Project Home Key (PHK)")
    TINY_HOME_VILLAGE = "Tiny Home Village", _("Tiny Home Village")
    WINTER_SHELTER = "Winter Shelter", _("Winter Shelter")
    EMERGENCY_SHELTER = "Emergency Shelter", _("Emergency Shelter")
    CRISIS_HOUSING = "Crisis Housing", _("Crisis Housing")
    RECUPERATIVE_CARE = "Recuperative Care", _("Recuperative Care")
    TRANSITIONAL_HOUSING = "Transitional Housing", _("Transitional Housing")
    ROADMAP_HOME = "Roadmap Home", _("Roadmap Home")
    RAPID_REHOUSING = "Rapid Rehousing", _("Rapid Rehousing")
    SOBER_LIVING = "Sober Living", _("Sober Living")
    SAFE_PARK_LA = "Safe Park LA", _("Safe Park LA")


class PopulationChoices(models.TextChoices):
    ADULTS = "Adults", _("Adults")
    MEN = "Men", _("Men")
    WOMEN = "Women", _("Women")
    FAMILIES = "Families", _("Families")
    YOUTH = "Youth (TAY)", _("Youth (TAY)")
    BOYS = "Boys", _("Boys")
    GIRLS = "Girls", _("Girls")
    SENIORS = "Seniors (55+)", _("Seniors (55+)")
    VETERANS = "Veterans", _("Veterans")
    LGBTQ = "LGBTQ", _("LGBTQ")
    HIV_AND_AIDS = "HIV/AIDS", _("HIV/AIDS")


class ImmediateNeedChocies(models.TextChoices):
    FOOD = "Food", _("Food")
    SHOWERS = "Showers", _("Showers")
    CLOTHING = "Clothing", _("Clothing")


class GeneralServiceChoices(models.TextChoices):
    MAIL = "Mail", _("Mail")
    PHONE = "Phone", _("Phone")
    COMPUTERS = "Computers", _("Computers")
    LEGAL_ASSISTANCE = "Legal Assistance", _("Legal Assistance")
    TRANSPORTATION = "Transportation", _("Transportation")
    CASE_MANAGEMENT = "Case Management", _("Case Management")
    MONEY_MANAGEMENT = "Money Management", _("Money Management")


class HealthServiceChoices(models.TextChoices):
    MEDICATION_MONITORING = "Medication Monitoring", _("Medication Monitoring")
    MEDICATION_ADMINISTRATION = "Medication Administration", _("Medication Administration")
    MENTAL_HEALTH = "Mental Health", _("Mental Health")
    DRUG_TREATMENT = "Drug Treatment", _("Drug Treatment")


class CareerServiceChoices(models.TextChoices):
    JOB_TRAINING = "Job Training", _("Job Training")
    TUTORING = "Tutoring", _("Tutoring")
    LIFE_SKILLS_TRAINING = "Life Skills Training", _("Life Skills Training")


class FunderChoices(models.TextChoices):
    LAHSA = "LAHSA", _("LAHSA")
    DMH = "DMH", _("DMH")
    DHS = "DHS", _("DHS")
    PRIVATE = "Private", _("Private")
    FEDERAL_FUNDING = "Federal Funding", _("Federal Funding")
    HOPWA = "HOPWA", _("HOPWA")


class AccessibilityChoices(models.TextChoices):
    WHEELCHAIR_ACCESSIBLE = "Wheelchair Accessible", _("Wheelchair Accessible")
    MEDICAL_EQUIPMENT_PERMITTED = "Medical Equipment Permitted", _("Medical Equipment Permitted")


class StorageChoices(models.TextChoices):
    STORAGE = "Storage", _("Storage")
    LOCKERS = "Lockers", _("Lockers")
    AMNESTY_LOCKERS = "Amnesty Lockers", _("Amnesty Lockers")


class ParkingChoices(models.TextChoices):
    AUTO_OR_SMALL_TRUCK = "Auto or Small Truck", _("Auto or Small Truck")
    BICYCLE = "Bicycle", _("Bicycle")
    MOTOR_CYCLE = "Motor Cycle", _("Motor Cycle")
    RV = "RV", _("RV")


# Restrictions
class EntryRequirementChoices(models.TextChoices):
    PHOTO_ID = "Photo ID", _("Photo ID")
    MEDICAID_OR_MEDICARE = "Medicaid or Medicare", _("Medicaid or Medicare")
    RESERVATION = "Reservation", _("Reservation")
    REFERRAL = "Referral", _("Referral")


class CityChoices(models.TextChoices):
    AGOURA_HILLS = "Agoura Hills", _("Agoura Hills")
    ALHAMBRA = "Alhambra", _("Alhambra")
    ARCADIA = "Arcadia", _("Arcadia")
    ARTESIA = "Artesia", _("Artesia")
    AVALON = "Avalon", _("Avalon")
    AZUSA = "Azusa", _("Azusa")
    BALDWIN_PARK = "Baldwin Park", _("Baldwin Park")
    BELL = "Bell", _("Bell")
    BELL_GARDENS = "Bell Gardens", _("Bell Gardens")
    BELLFLOWER = "Bellflower", _("Bellflower")
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
    WHITTIER = "Whittier", _("Whittier")


class PetChoices(models.TextChoices):
    SERVICE_ANIMAL = "Service Animal", _("Service Animal")
    CATS = "Cats", _("Cats")
    EMOTIONAL_SUPPORT = "Emotional Support", _("Emotional Support")
    DOGS_UNDER_25_LBS = "Dogs <25lbs", _("Dogs <25lbs")
    DOGS_OVER_25_LBS = "Dogs >25lbs", _("Dogs >25lbs")
    EXOTICS = "Exotics", _("Exotics")


# Bed Information
class SleepingChocies(models.TextChoices):
    LOW_BARRIER = "Low Barrier", _("Low Barrier")
    BED_LAYOUT_DESCRIPTION = "Bed Layout Description", _("Bed Layout Description")
    BUNK_BEDS = "Bunk beds", _("Bunk beds")
    SHARED_ROOMS = "Shared Rooms", _("Shared Rooms")
    DORMITORY = "Dormitory", _("Dormitory")
    MOTEL = "Motel", _("Motel")
    SINGLE_ROOM = "Single Room", _("Single Room")
