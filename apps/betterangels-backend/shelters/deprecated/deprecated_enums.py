from django.db import models
from django.utils.translation import gettext_lazy as _


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


class SleepingChoices(models.TextChoices):
    BUNK_BEDS = "bunk_beds", _("Bunk beds")
    DORMITORY = "dormitory", _("Dormitory")
    LOW_BARRIER = "low_barrier", _("Low Barrier")
    MOTEL = "motel", _("Motel")
    SHARED_ROOMS = "shared_rooms", _("Shared Rooms")
    SINGLE_ROOM = "single_room", _("Single Room")


class RoomStyleChoicesV14(models.TextChoices):
    CONGREGANT = "congregant", _("Congregant (Open)")
    CUBICLE_LOW_WALLS = "cubicle_low_walls", _("Cubicle (Low Walls)")
    CUBICLE_HIGH_WALLS = "cubicle_high_walls", _("Cubicle (High Walls)")
    SHARED_ROOMS = "shared_rooms", _("Shared Rooms")
    SINGLE_ROOM = "single_room", _("Single Room")
    MOTEL_ROOM = "motel_room", _("Motel Room")
    OTHER = "other", _("Other")
