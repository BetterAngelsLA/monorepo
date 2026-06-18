"""
URL configuration for betterangels_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

import admin_async_upload.views
from accounts.headless_views import AutoCreateRequestLoginCodeView
from allauth.headless.constants import Client
from betterangels_backend import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic.base import RedirectView
from strawberry.django.views import GraphQLView

from .schema import schema

urlpatterns = [
    path("", RedirectView.as_view(url="/admin/", permanent=False), name="home"),
    path("", include("accounts.urls")),
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls"), name="accounts"),
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path(
        "graphql",
        ensure_csrf_cookie(
            GraphQLView.as_view(
                schema=schema,
                # https://github.com/strawberry-graphql/strawberry/issues/3655#issuecomment-2386409153
                multipart_uploads_enabled=True,
            )
        ),
    ),
    path("legal/", include("legal.urls")),
    path("proxy/", include("proxy.urls"), name="proxy"),
    path("reports/", include("reports.urls"), name="reports"),
    path("upload/", admin_async_upload.views.admin_resumable, name="admin_resumable"),
    # Override request_login_code with custom view that auto-creates users
    # for unknown emails. Uses as_api_view(client=BROWSER) so the headless
    # decorator sets request.allauth.headless.client correctly.
    path(
        "_allauth/browser/v1/auth/code/request",
        AutoCreateRequestLoginCodeView.as_api_view(client=Client.BROWSER),
    ),
    path("_allauth/", include("allauth.headless.urls", namespace="headless")),
]


if settings.DEBUG:
    from urllib.parse import urlparse

    media_path = urlparse(settings.MEDIA_URL).path
    urlpatterns += static(media_path, document_root=settings.MEDIA_ROOT)
