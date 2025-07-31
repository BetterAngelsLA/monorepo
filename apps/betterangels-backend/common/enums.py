import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


class AttachmentType(models.TextChoices):
    IMAGE = "image", _("Image")
    DOCUMENT = "document", _("Document")
    AUDIO = "audio", _("Audio")
    VIDEO = "video", _("Video")
    UNKNOWN = "unknown", _("Unknown")


@strawberry.enum
class SelahTeamEnum(models.TextChoices):
    BOWTIE_RIVERSIDE_OUTREACH = "bowtie_riverside_outreach", _("Bowtie & Riverside Outreach")
    ECHO_PARK_ON_SITE = "echo_park_on_site", _("Echo Park On-site")
    ECHO_PARK_OUTREACH = "echo_park_outreach", _("Echo Park Outreach")
    HOLLYWOOD_ON_SITE = "hollywood_on_site", _("Hollywood On-site")
    HOLLYWOOD_OUTREACH = "hollywood_outreach", _("Hollywood Outreach")
    LA_RIVER_OUTREACH = "la_river_outreach", _("LA River Outreach")
    LOS_FELIZ_OUTREACH = "los_feliz_outreach", _("Los Feliz Outreach")
    NORTHEAST_HOLLYWOOD_OUTREACH = "northeast_hollywood_outreach", _("Northeast Hollywood Outreach")
    SILVER_LAKE_OUTREACH = "silver_lake_outreach", _("Silver Lake Outreach")
    SLCC_ON_SITE = "slcc_on_site", _("SLCC On-site")
    SUNDAY_SOCIAL_ATWATER_ON_SITE = "sunday_social_atwater_on_site", _("Sunday Social / Atwater On-site")
    SUNDAY_SOCIAL_ATWATER_OUTREACH = "sunday_social_atwater_outreach", _("Sunday Social / Atwater Outreach")
    WDI_ON_SITE = "wdi_on_site", _("WDI On-site")
    WDI_OUTREACH = "wdi_outreach", _("WDI Outreach")
