"""
ASGI config for betterangels_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

import newrelic.agent
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "betterangels_backend.settings")

newrelic.agent.initialize()
application = get_asgi_application()
