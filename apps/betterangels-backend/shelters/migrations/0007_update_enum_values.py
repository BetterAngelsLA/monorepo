# migrations/0007_update_enum_values.py

from django.db import migrations
from django.db import connection


def update_enum_values(apps, schema_editor, model_name, field_name, value_mapping):
    with connection.cursor() as cursor:
        for old_value, new_value in value_mapping["values"].items():
            # Check if the old enum value exists
            cursor.execute(f"SELECT id FROM {model_name} WHERE {field_name} = %s", [old_value])
            old_id = cursor.fetchone()

            # Check if the new enum value exists
            cursor.execute(f"SELECT id FROM {model_name} WHERE {field_name} = %s", [new_value])
            new_id = cursor.fetchone()

            if old_id and not new_id:
                # If the old value exists but the new value does not, update the old value to the new one
                cursor.execute(f"UPDATE {model_name} SET {field_name} = %s WHERE id = %s", [new_value, old_id[0]])
            elif old_id and new_id and value_mapping.get("through_table") and value_mapping.get("through_column"):
                # If both old and new values exist, update the through table to reference the new ID
                cursor.execute(
                    f"UPDATE {value_mapping['through_table']} SET {value_mapping['through_column']} = %s WHERE {value_mapping['through_column']} = %s",
                    [new_id[0], old_id[0]],
                )

                # Delete the old enum value
                cursor.execute(f"DELETE FROM {model_name} WHERE id = %s", [old_id[0]])


def update_enum_values_forward(apps, schema_editor):
    enum_mappings = {
        "shelters_sheltertype": {
            "values": {
                "A Bridge Home": "a_bridge_home",
                "Crisis Housing": "crisis_housing",
                "Emergency Shelter": "emergency_shelter",
                "Faith Based": "faith_based",
                "Interim Housing": "interim_housing",
                "Permanent Housing": "permanent_housing",
                "Project Home Key (PHK)": "project_homekey",
                "Rapid Rehousing": "rapid_rehousing",
                "Recuperative Care": "recuperative_care",
                "Roadmap Home": "roadmap_home",
                "Safe Park LA": "safe_park_la",
                "Sober Living": "sober_living",
                "Tiny Home Village": "tiny_home_village",
                "Transitional Housing": "transitional_housing",
                "Winter Shelter": "winter_shelter",
            },
            "through_table": "shelters_shelter_shelter_types",
            "through_column": "sheltertype_id",
        },
        "shelters_population": {
            "values": {
                "B7 Bridge Housing for Persons Exiting Justice System Institutions": "justice_system_exiting",
                "Enhanced Bridge Housing for Women": "enhanced_bridge_housing_women",
                "Enhanced Bridge Housing for Older Adults": "enhanced_bridge_housing_older_adults",
                "Adults": "adults",
                "Boys": "boys",
                "Children": "children",
                "Domestic Violence (DV/IPV)": "domestic_violence",
                "Families": "families",
                "Girls": "girls",
                "HIV/AIDS": "hiv_and_aids",
                "Human Trafficking": "human_trafficking",
                "LGBTQ": "lgbtq",
                "Men": "men",
                "Seniors (55+)": "seniors",
                "Veterans": "veterans",
                "Women": "women",
                "Youth (TAY)": "youth",
            },
            "through_table": "shelters_shelter_populations",
            "through_column": "population_id",
        },
        "shelters_immediateneed": {
            "values": {
                "Clothing": "clothing",
                "Food": "food",
                "Showers": "showers",
            },
            "through_table": "shelters_shelter_immediate_needs",
            "through_column": "immediateneed_id",
        },
        "shelters_generalservice": {
            "values": {
                "Case Management": "case_management",
                "Childcare": "childcare",
                "Computers": "computers",
                "Financial Literacy/Assistance": "financial_literacy_assistance",
                "Housing Navigation": "housing_navigation",
                "Legal Assistance": "legal_assistance",
                "Mail": "mail",
                "Phone": "phone",
                "Transportation": "transportation",
            },
            "through_table": "shelters_shelter_general_services",
            "through_column": "generalservice_id",
        },
        "shelters_healthservice": {
            "values": {
                "Medication Administration": "medication_administration",
                "Medication Monitoring": "medication_monitoring",
                "Mental Health": "mental_health",
                "Substance Use Treatment": "substance_use_treatment",
            },
            "through_table": "shelters_shelter_health_services",
            "through_column": "healthservice_id",
        },
        "shelters_careerservice": {
            "values": {
                "Job Training": "job_training",
                "Life Skills Training": "life_skills_training",
                "Tutoring": "tutoring",
            },
            "through_table": "shelters_shelter_career_services",
            "through_column": "careerservice_id",
        },
        "shelters_funder": {
            "values": {
                "DHS": "dhs",
                "DMH": "dmh",
                "Federal Funding": "federal_funding",
                "HOPWA": "hopwa",
                "LAHSA": "lahsa",
                "Private": "private",
                "City of Los Angeles": "city_of_los_angeles",
            },
            "through_table": "shelters_shelter_funders",
            "through_column": "funder_id",
        },
        "shelters_accessibility": {
            "values": {
                "Medical Equipment Permitted": "medical_equipment_permitted",
                "Wheelchair Accessible": "wheelchair_accessible",
            },
            "through_table": "shelters_shelter_accessibility",
            "through_column": "accessibility_id",
        },
        "shelters_storage": {
            "values": {
                "Amnesty Lockers": "amnesty_lockers",
                "Lockers": "lockers",
                "Storage": "storage",
            },
            "through_table": "shelters_shelter_storage",
            "through_column": "storage_id",
        },
        "shelters_parking": {
            "values": {
                "Auto or Small Truck": "auto_or_small_truck",
                "Bicycle": "bicycle",
                "Motorcycle": "motorcycle",
                "RV": "rv",
            },
            "through_table": "shelters_shelter_parking",
            "through_column": "parking_id",
        },
        "shelters_entryrequirement": {
            "values": {
                "Medicaid or Medicare": "medicaid_or_medicare",
                "Photo ID": "photo_id",
                "Referral": "referral",
                "Reservation": "reservation",
            },
            "through_table": "shelters_shelter_entry_requirements",
            "through_column": "entryrequirement_id",
        },
        "shelters_city": {
            "values": {
                "Agoura Hills": "agoura_hills",
                "Alhambra": "alhambra",
                "Arcadia": "arcadia",
                "Artesia": "artesia",
                "Avalon": "avalon",
                "Azusa": "azusa",
                "Baldwin Park": "baldwin_park",
                "Bell": "bell",
                "Bellflower": "bellflower",
                "Bell Gardens": "bell_gardens",
                "Beverly Hills": "beverly_hills",
                "Bradbury": "bradbury",
                "Burbank": "burbank",
                "Calabasas": "calabasas",
                "Carson": "carson",
                "Cerritos": "cerritos",
                "Claremont": "claremont",
                "Commerce": "commerce",
                "Compton": "compton",
                "Covina": "covina",
                "Cudahy": "cudahy",
                "Culver City": "culver_city",
                "Diamond Bar": "diamond_bar",
                "Downey": "downey",
                "Duarte": "duarte",
                "El Monte": "el_monte",
                "El Segundo": "el_segundo",
                "Gardena": "gardena",
                "Glendale": "glendale",
                "Glendora": "glendora",
                "Hawaiian Gardens": "hawaiian_gardens",
                "Hawthorne": "hawthorne",
                "Hermosa Beach": "hermosa_beach",
                "Hidden Hills": "hidden_hills",
                "Hollywood": "hollywood",
                "Huntington Park": "huntington_park",
                "Industry": "industry",
                "Inglewood": "inglewood",
                "Irwindale": "irwindale",
                "La Canada Flintridge": "la_canada_flintridge",
                "La Habra Heights": "la_habra_heights",
                "La Mirada": "la_mirada",
                "La Puente": "la_puente",
                "La Verne": "la_verne",
                "Lakewood": "lakewood",
                "Lancaster": "lancaster",
                "Lawndale": "lawndale",
                "Lomita": "lomita",
                "Long Beach": "long_beach",
                "Los Angeles": "los_angeles",
                "Lynwood": "lynwood",
                "Malibu": "malibu",
                "Manhattan Beach": "manhattan_beach",
                "Maywood": "maywood",
                "Monrovia": "monrovia",
                "Montebello": "montebello",
                "Monterey Park": "monterey_park",
                "Norwalk": "norwalk",
                "Palmdale": "palmdale",
                "Palos Verdes Estates": "palos_verdes_estates",
                "Paramount": "paramount",
                "Pasadena": "pasadena",
                "Pico Rivera": "pico_rivera",
                "Pomona": "pomona",
                "Rancho Palos Verdes": "rancho_palos_verdes",
                "Redondo Beach": "redondo_beach",
                "Rolling Hills": "rolling_hills",
                "Rolling Hills Estates": "rolling_hills_estates",
                "Rosemead": "rosemead",
                "San Dimas": "san_dimas",
                "San Fernando": "san_fernando",
                "San Gabriel": "san_gabriel",
                "San Marino": "san_marino",
                "Santa Clarita": "santa_clarita",
                "Santa Fe Springs": "santa_fe_springs",
                "Santa Monica": "santa_monica",
                "Sierra Madre": "sierra_madre",
                "Signal Hill": "signal_hill",
                "South El Monte": "south_el_monte",
                "South Gate": "south_gate",
                "South Pasadena": "south_pasadena",
                "Temple City": "temple_city",
                "Torrance": "torrance",
                "Vernon": "vernon",
                "Venice": "venice",
                "Walnut": "walnut",
                "West Covina": "west_covina",
                "West Hollywood": "west_hollywood",
                "Westlake Village": "westlake_village",
                "West Los Angeles": "west_los_angeles",
                "Whittier": "whittier",
            },
            "through_table": "shelters_shelter_cities",
            "through_column": "city_id",
        },
        "shelters_pet": {
            "values": {
                "Cats": "cats",
                "Dogs >25lbs": "dogs_over_25lbs",
                "Dogs <25lbs": "dogs_under_25lbs",
                "Emotional Support": "emotional_support",
                "Exotics": "exotics",
                "Service Animal": "service_animal",
            },
            "through_table": "shelters_shelter_pets",
            "through_column": "pet_id",
        },
        "shelters_sleepingoption": {
            "values": {
                "Bunk beds": "bunk_beds",
                "Dormitory": "dormitory",
                "Low Barrier": "low_barrier",
                "Motel": "motel",
                "Shared Rooms": "shared_rooms",
                "Single Room": "single_room",
            },
            "through_table": "shelters_shelter_sleeping_options",
            "through_column": "sleepingoption_id",
        },
    }

    for model_name, mapping_info in enum_mappings.items():
        update_enum_values(apps, schema_editor, model_name, "name", mapping_info)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0006_alter_shelter_options_shelter_reviewed"),  # Update with the correct previous migration
    ]

    operations = [
        migrations.RunPython(update_enum_values_forward),
    ]
