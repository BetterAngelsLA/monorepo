"""Seed data for shelter lookups (SPAs), city names, and service catalog.

Replaces RunPython data migrations. Called by post_migrate signal.
"""

from logging import getLogger

from shelters.models.lookups import SPA

logger = getLogger(__name__)

CITY_NAMES = [
    "Agoura Hills",
    "Alhambra",
    "Arcadia",
    "Artesia",
    "Avalon",
    "Azusa",
    "Baldwin Park",
    "Bell",
    "Bell Gardens",
    "Bellflower",
    "Beverly Hills",
    "Bradbury",
    "Burbank",
    "Calabasas",
    "Carson",
    "Cerritos",
    "Claremont",
    "Commerce",
    "Compton",
    "Covina",
    "Cudahy",
    "Culver City",
    "Diamond Bar",
    "Downey",
    "Duarte",
    "El Monte",
    "El Segundo",
    "Gardena",
    "Glendale",
    "Glendora",
    "Hawaiian Gardens",
    "Hawthorne",
    "Hermosa Beach",
    "Hidden Hills",
    "Hollywood",
    "Huntington Park",
    "Industry",
    "Inglewood",
    "Irwindale",
    "La Canada Flintridge",
    "La Habra Heights",
    "La Mirada",
    "La Puente",
    "La Verne",
    "Lakewood",
    "Lancaster",
    "Lawndale",
    "Lomita",
    "Long Beach",
    "Los Angeles",
    "Lynwood",
    "Malibu",
    "Manhattan Beach",
    "Maywood",
    "Monrovia",
    "Montebello",
    "Monterey Park",
    "Norwalk",
    "Palmdale",
    "Palos Verdes Estates",
    "Paramount",
    "Pasadena",
    "Pico Rivera",
    "Pomona",
    "Rancho Palos Verdes",
    "Redondo Beach",
    "Rolling Hills",
    "Rolling Hills Estates",
    "Rosemead",
    "San Dimas",
    "San Fernando",
    "San Gabriel",
    "San Marino",
    "Santa Clarita",
    "Santa Fe Springs",
    "Santa Monica",
    "Sierra Madre",
    "Signal Hill",
    "South El Monte",
    "South Gate",
    "South Pasadena",
    "Temple City",
    "Torrance",
    "Vernon",
    "Venice",
    "Walnut",
    "West Covina",
    "West Hollywood",
    "West Los Angeles",
    "Westlake Village",
    "Whittier",
    "Wilmington",
]

SPA_DATA = [
    (1, "1", "1 - Antelope Valley"),
    (2, "2", "2 - San Fernando"),
    (3, "3", "3 - San Gabriel"),
    (4, "4", "4 - Metro"),
    (5, "5", "5 - West"),
    (6, "6", "6 - South"),
    (7, "7", "7 - East"),
    (8, "8", "8 - South Bay/Harbor"),
]

SERVICE_CATALOG = [
    (
        "immediate_need",
        "Immediate Needs",
        0,
        [
            ("clothing", "Clothing", 0),
            ("food", "Food", 1),
            ("showers", "Showers", 2),
        ],
    ),
    (
        "general",
        "General Services",
        1,
        [
            ("case_management", "Case Management", 0),
            ("childcare", "Childcare", 1),
            ("computer_access", "Computer Access", 2),
            ("employment_services", "Employment Services", 3),
            ("financial_literacy_assistance", "Financial Literacy/Assistance", 4),
            ("housing_navigation", "Housing Navigation", 5),
            ("legal_assistance", "Legal Assistance", 6),
            ("mail", "Mail", 7),
            ("phone", "Phone", 8),
            ("transportation", "Transportation", 9),
            ("laundry", "Laundry Services", 10),
            ("tls", "TLS (Time Limited Subsidies)", 11),
        ],
    ),
    (
        "health",
        "Health Services",
        2,
        [
            ("dental", "Dental", 0),
            ("medical", "Medical", 1),
            ("mental_health", "Mental Health", 2),
            ("substance_use_treatment", "Substance Use Treatment", 3),
        ],
    ),
    (
        "training",
        "Training Services",
        3,
        [
            ("job_training", "Job Training", 0),
            ("life_skills_training", "Life Skills Training", 1),
            ("tutoring", "Tutoring", 2),
        ],
    ),
    (
        "meal",
        "Meal Services",
        4,
        [
            ("breakfast", "Breakfast", 0),
            ("lunch", "Lunch", 1),
            ("dinner", "Dinner", 2),
        ],
    ),
]


def seed_spas() -> None:
    # Skip if already seeded — avoids 8 queries when DB is warm.
    if SPA.objects.exists():
        return
    from shelters.enums import SPAChoices

    SPA.objects.bulk_create(
        [SPA(name=SPAChoices(name), short_name=short_name, long_name=long_name) for name, short_name, long_name in SPA_DATA],
        ignore_conflicts=True,
    )
    logger.info("Seeded %d SPAs", len(SPA_DATA))


def seed_cities() -> None:
    """Seed LA County cities (matching original migration)."""
    from shelters.models.lookups import City

    # Skip if already seeded — avoids 90+ queries when DB is warm.
    if City.objects.exists():
        return
    City.objects.bulk_create(
        [City(name=name) for name in CITY_NAMES],
        ignore_conflicts=True,
    )
    logger.info("Seeded %d cities", len(CITY_NAMES))


def seed_services() -> None:
    """Seed ServiceCategory and Service catalog (matching original migration)."""
    from shelters.models.service import Service, ServiceCategory

    # Skip if already seeded.
    if ServiceCategory.objects.exists():
        return

    categories = []
    services = []
    for cat_name, cat_display, cat_order, svc_list in SERVICE_CATALOG:
        categories.append(ServiceCategory(name=cat_name, display_name=cat_display, priority=cat_order))
        for svc_name, svc_display, svc_order in svc_list:
            services.append(
                Service(
                    category=ServiceCategory(name=cat_name),  # FK resolved by name
                    name=svc_name,
                    display_name=svc_display,
                    priority=svc_order,
                    is_other=False,
                )
            )

    # Bulk-insert categories first so FK references resolve.
    ServiceCategory.objects.bulk_create(categories, ignore_conflicts=True)
    # Resolve category FKs from DB so bulk_create can reference them.
    cat_map = {c.name: c for c in ServiceCategory.objects.filter(name__in=[c.name for c in categories])}
    for svc in services:
        svc.category = cat_map[svc.category.name]
    Service.objects.bulk_create(services, ignore_conflicts=True)
    logger.info("Seeded %d categories, %d services", len(categories), len(services))


def seed_shelter_lookups() -> None:
    seed_spas()
    seed_cities()
    seed_services()
