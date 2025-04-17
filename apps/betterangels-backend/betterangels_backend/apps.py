from django.contrib.admin.apps import AdminConfig


class MagicLinkAdminConfig(AdminConfig):
    default_site = "betterangels_backend.admin.MagicLinkAdminSite"
